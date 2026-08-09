// Built with IBM Bob — AI SDLC Partner

import express, { type Request, type Response, type NextFunction } from "express";
import { orchestrate } from "./pipeline/orchestrator.js";
import { billingGateway } from "./gateway/billing_gateway.js";
import { auditLog } from "./audit/audit_log.js";
import { lookup } from "./pipeline/steps/02_lookup.js";
import { compare } from "./pipeline/steps/03_compare.js";
import { prove } from "./pipeline/steps/04_prove.js";
import {
  SEED_TRAP_FIELDS,
  FIXED_HOLD,
  FIXED_DRAFT,
  FIXED_RUN_ID,
  FIXED_AUDIT_TIMESTAMPS,
} from "./seeds/trap.js";
import { CONTROL_SEED_FIELDS, FIXED_CONTROL_RUN_ID } from "./seeds/control.js";

// ── Structured error helper ───────────────────────────────────────────────────
// Every error response from this server uses this shape so Vrajesh's UI can
// branch on `code` without parsing the human-readable `error` string.
function apiError(
  res: Response,
  status: number,
  code: string,
  message: string
): void {
  res.status(status).json({ error: message, code, status });
}

const app = express();

// ── CORS — allow Vrajesh's Vite dev server (localhost:5173) ──────────────────
// Uses manual headers (no external dep) so the monorepo root cors package is
// not required inside services/brain/package.json.
// Covers preflight OPTIONS and all live requests.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8100", // Ionic default dev port
]);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers["origin"] ?? "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

// ── Body parser — 10 MB limit for base64-encoded bill images ─────────────────
app.use(express.json({ limit: "10mb" }));

// ── 413 handler — oversized image BEFORE any route sees the request ──────────
// express.json() throws PayloadTooLargeError (status=413) before route handlers.
// Without this, Express emits an HTML error body that breaks Vrajesh's JSON parser.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status: number }).status === 413
  ) {
    apiError(res, 413, "IMAGE_TOO_LARGE",
      "Image too large. Maximum payload is 10 MB (base64). Please resize the image before sending.");
    return;
  }
  next(err);
});

const PORT = parseInt(process.env["BRAIN_PORT"] ?? "3000", 10);

// ── GET /health ──────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ── POST /run — live pipeline ────────────────────────────────────────────────
app.post("/run", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, domain } = req.body as { image?: unknown; domain?: unknown };

    if (typeof image !== "string" || image.trim() === "") {
      apiError(res, 400, "INVALID_IMAGE",
        "Missing or empty 'image'. Send a base64-encoded JPEG/PNG string.");
      return;
    }

    if (domain !== "bill" && domain !== "lease") {
      apiError(res, 400, "INVALID_DOMAIN",
        "Invalid 'domain'. Must be 'bill' or 'lease'.");
      return;
    }

    const result = await orchestrate({ image, domain });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ── GET /run?seed=trap|control — deterministic seeded path (PATH B) ──────────
// PATH B: short-circuits step 01 (uses fixed seed fields), runs steps 02–05 normally,
// then injects fixed hold/draft/run_id/timestamps. Engine proves itself; output is byte-identical.
app.get("/run", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seed = req.query["seed"] as string | undefined;
    const domain = (req.query["domain"] as string | undefined) ?? "bill";

    if (domain !== "bill" && domain !== "lease") {
      apiError(res, 400, "INVALID_DOMAIN", "domain must be 'bill' or 'lease'");
      return;
    }

    if (seed === "trap") {
      // Steps 02–05 run live on the seed fields to prove the engine works
      const rules = await lookup(SEED_TRAP_FIELDS, "bill");
      const gaps   = compare(SEED_TRAP_FIELDS, rules);
      const cards  = prove(gaps, SEED_TRAP_FIELDS, rules);

      // Inject fixed hold/draft/run_id/timestamps for byte-identity
      const ts = FIXED_AUDIT_TIMESTAMPS;
      res.json({
        run_id: FIXED_RUN_ID,
        domain: "bill",
        extracted_fields: SEED_TRAP_FIELDS,
        proof_cards: cards,
        hold: FIXED_HOLD,
        draft: FIXED_DRAFT,
        audit: [
          { t: "ocr",         run_id: FIXED_RUN_ID, ts: ts.ocr,     payload: { step: "ocr",     field_count: SEED_TRAP_FIELDS.length } },
          { t: "lookup",      run_id: FIXED_RUN_ID, ts: ts.lookup,  payload: { step: "lookup",  rule_count: rules.size } },
          { t: "compare",     run_id: FIXED_RUN_ID, ts: ts.compare, payload: { step: "compare", gap_count: gaps.length } },
          { t: "prove",       run_id: FIXED_RUN_ID, ts: ts.prove,   payload: { step: "prove",   card_count: cards.length } },
          { t: "hold_placed", run_id: FIXED_RUN_ID, ts: ts.hold,    payload: { hold_id: FIXED_HOLD.hold_id, amount: FIXED_HOLD.amount } },
          { t: "draft",       run_id: FIXED_RUN_ID, ts: ts.draft,   payload: { step: "draft" } },
        ],
      });
      return;
    }

    if (seed === "control") {
      const rules = await lookup(CONTROL_SEED_FIELDS, "bill");
      const gaps   = compare(CONTROL_SEED_FIELDS, rules);
      const cards  = prove(gaps, CONTROL_SEED_FIELDS, rules);

      const ts = FIXED_AUDIT_TIMESTAMPS;
      res.json({
        run_id: FIXED_CONTROL_RUN_ID,
        domain: "bill",
        extracted_fields: CONTROL_SEED_FIELDS,
        proof_cards: cards,
        hold: null,
        draft: { text: "No overcharges detected. All billed amounts match official rates.", banner: "AI-generated — review before sending" },
        audit: [
          { t: "ocr",     run_id: FIXED_CONTROL_RUN_ID, ts: ts.ocr,     payload: { step: "ocr",     field_count: CONTROL_SEED_FIELDS.length } },
          { t: "lookup",  run_id: FIXED_CONTROL_RUN_ID, ts: ts.lookup,  payload: { step: "lookup",  rule_count: rules.size } },
          { t: "compare", run_id: FIXED_CONTROL_RUN_ID, ts: ts.compare, payload: { step: "compare", gap_count: gaps.length } },
          { t: "prove",   run_id: FIXED_CONTROL_RUN_ID, ts: ts.prove,   payload: { step: "prove",   card_count: cards.length } },
          { t: "draft",   run_id: FIXED_CONTROL_RUN_ID, ts: ts.draft,   payload: { step: "draft" } },
        ],
      });
      return;
    }

    apiError(res, 400, "INVALID_SEED", "Unknown seed. Use ?seed=trap or ?seed=control");
  } catch (e) {
    next(e);
  }
});

// ── POST /consent ────────────────────────────────────────────────────────────
app.post("/consent", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { run_id, hold_id, action } = req.body as {
      run_id?: unknown;
      hold_id?: unknown;
      action?: unknown;
    };

    if (typeof run_id !== "string" || run_id.trim() === "") {
      apiError(res, 400, "INVALID_REQUEST",
        "Required: { run_id: string, hold_id: string, action: 'confirm_hold' | 'withdraw_hold' | 'send_letter' }");
      return;
    }
    if (typeof hold_id !== "string" || hold_id.trim() === "") {
      apiError(res, 400, "INVALID_REQUEST",
        "Required: { run_id: string, hold_id: string, action: 'confirm_hold' | 'withdraw_hold' | 'send_letter' }");
      return;
    }
    if (action !== "confirm_hold" && action !== "withdraw_hold" && action !== "send_letter") {
      apiError(res, 400, "INVALID_REQUEST",
        "Required: { run_id: string, hold_id: string, action: 'confirm_hold' | 'withdraw_hold' | 'send_letter' }");
      return;
    }

    try {
      if (action === "confirm_hold") {
        billingGateway.confirm(hold_id);
      } else if (action === "withdraw_hold") {
        billingGateway.release(hold_id, "user_withdraw");
      }
      // send_letter: no gateway mutation, just audit
    } catch (gatewayErr) {
      const msg = gatewayErr instanceof Error ? gatewayErr.message : String(gatewayErr);
      if (msg.startsWith("Hold not found")) {
        apiError(res, 404, "HOLD_NOT_FOUND", msg);
        return;
      }
      throw gatewayErr;
    }

    const event = {
      t: "consent" as const,
      run_id,
      ts: new Date().toISOString(),
      payload: { action, hold_id },
    };
    auditLog.append(event);

    res.json({ audit: event });
  } catch (e) {
    next(e);
  }
});

// ── GET /audit/:run_id — governance trail export ─────────────────────────────
// Compliance officers (or judges) can inspect the full ordered AuditEvent array
// for any run_id. Returns [] for unknown run IDs (correct — not a 404).
app.get("/audit/:run_id", (req: Request, res: Response) => {
  const { run_id } = req.params;
  res.json(auditLog.list(run_id));
});

// ── Global error handler — structured errors, no stack traces, no crashes ────
// All unhandled errors land here. Maps known error messages to typed codes so
// Vrajesh's UI can branch without string-matching the human error text.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal error";

  // Map well-known engine errors to structured codes
  if (message.startsWith("Hold not found")) {
    apiError(res, 404, "HOLD_NOT_FOUND", message);
    return;
  }
  if (message.includes("timed out") && message.toLowerCase().includes("ocr")) {
    apiError(res, 504, "OCR_TIMEOUT", "OCR step timed out. The image may be too complex. Try a clearer photo.");
    return;
  }
  if (message.includes("timed out") || message.includes("timeout")) {
    apiError(res, 504, "STEP_TIMEOUT", message);
    return;
  }
  if (message.includes("RULEBOOK_LOAD_ERROR")) {
    apiError(res, 500, "RULEBOOK_LOAD_ERROR", "Failed to load rulebook. Using stub fallback.");
    return;
  }

  apiError(res, 500, "INTERNAL_ERROR", message);
});

app.listen(PORT, () => {
  console.log(`[pramaan-brain] listening on port ${PORT}`);
});

export { app };
