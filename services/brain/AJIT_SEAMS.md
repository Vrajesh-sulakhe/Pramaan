# Ajit's Seams — Handoff Guide

> **Pramaan · IBM Docling + IBM Granite integration**
> Team role: OCR extraction (`01_read.ts`) and plain-language letter generation (`06_draft.ts`).
> Owner: **Ajit**
> Trunk owner: **Murgesh** — all other files are off-limits.

---

## The Two Files You Own

| File | Step | IBM Technology | What You Replace |
|---|---|---|---|
| `services/brain/src/pipeline/steps/01_read.ts` | 01 READ | **IBM Docling** (PDF/image structured extraction) | Body between seam markers |
| `services/brain/src/pipeline/steps/06_draft.ts` | 06 DRAFT | **IBM Granite** (plain-language letter generation) | Body between seam markers |

**Edit ONLY the code between the seam markers:**

```
// ═══════════════ AJIT SEAM — START ═══════════════
// ... replace everything in here ...
// ═══════════════ AJIT SEAM — END ══════════════════
```

Do not touch the function signature, the imports at the top, the export, or any line outside the markers.

---

## File 1 — `01_read.ts`

### Signature (Murgesh's — do not change)

```typescript
export async function read(req: RunRequest): Promise<ExtractedField[]>
```

### `ExtractedField` shape (from `@pramaan/contracts`)

```typescript
interface ExtractedField {
  text: string;                              // raw line text as read from document
  value: number | null;                      // the numeric amount; null if unreadable
  unit: string | null;                       // e.g. "per tablet", "per scan"
  bbox: [number, number, number, number];    // [x, y, width, height] in pixels
  confidence: number;                        // OCR confidence 0..1
  low_conf: boolean;                         // set by applyConfidenceGate — do NOT hardcode
}
```

### Rules

1. **Report reads exactly.** Never round, correct, or adjust a value. If the bill says 45, return 45. The gap detection engine does the arithmetic.
2. **Confidence gate is owned here, by one function.** Your body MUST call `applyConfidenceGate(fields)` before returning (it is already imported at the top of the file). Do NOT reimplement the 0.90 threshold anywhere — not in your body, not in a helper. There is exactly one confidence gate in this codebase. Two gates = two thresholds = drift between OCR and hold logic.
3. **Never throw.** On blank/unreadable input, return `[]`. Wrap Docling failures in a try/catch and return `[]`.
4. **Docling for PDFs, Tesseract fallback for plain images.** `req.image` is either a base64-encoded string or a file path to a PDF/image.
5. `low_conf` on each field is set by `applyConfidenceGate` — do not set it manually.

### Minimal skeleton (for reference)

```typescript
// inside AJIT SEAM — your real implementation
const rawFields = await callDocling(req.image);   // your call
return applyConfidenceGate(rawFields);             // one gate, always last
```

---

## File 2 — `06_draft.ts`

### Signature (Murgesh's — do not change)

```typescript
export async function draft(
  cards: ProofCard[],
  hold: HoldEvent | null,
  template: string
): Promise<Draft>
```

### `ProofCard` shape (from `@pramaan/contracts`)

```typescript
interface ProofCard {
  item: string;
  your_value: number;
  official_value: number;
  gap: number;
  status: "gap" | "ok" | "unverified";
  source_anchor: { ref: string; bbox?: [...]; ocr_confidence?: number };
  rule_anchor: { ref: string; url?: string };
  compute_anchor: string;     // e.g. "8500 - 6400"
  rule_says_plain: string;
}
```

### `Draft` shape (from `@pramaan/contracts`)

```typescript
interface Draft {
  text: string;    // the complaint letter body
  banner: string;  // MUST always be "AI-generated — review before sending"
}
```

### Rules

1. **Granite touches wording only.** Every number in the letter must come from the `cards` array. If Granite outputs a number not present in the cards, discard it.
2. **`banner` is non-negotiable.** Always `"AI-generated — review before sending"` — on success, on fallback, always. Never omit it.
3. **Fallback is mandatory.** If Granite fails or times out (use a 10-second limit), fall back to the `templateFillStub` helper already in the file. The letter must render without a model. A Granite outage must not break the `/run` endpoint.
4. **Only `status === "gap"` cards go in the letter.** Skip `"ok"` and `"unverified"` cards.
5. **If `hold !== null`**, include a line about the hold amount and its auto-release time.

### Minimal skeleton (for reference)

```typescript
// inside AJIT SEAM — your real implementation
try {
  const graniteText = await callGranite(cards, template);  // your call, 10s timeout
  return { text: graniteText, banner: "AI-generated — review before sending" };
} catch {
  return templateFillStub(cards, hold, template);          // fallback already in file
}
```

---

## What You Must NEVER Touch

| File / Symbol | Reason |
|---|---|
| `pipeline/orchestrator.ts` | Threads all 6 steps — Murgesh owns the wiring |
| `pipeline/steps/02_lookup.ts` | MCP rulebook lookup |
| `pipeline/steps/03_compare.ts` | Hallucination-free arithmetic — no model in path |
| `pipeline/steps/04_prove.ts` | ProofCard builder |
| `pipeline/steps/05_act.ts` | MCP hold placement |
| `pipeline/confidence.ts` | The ONE confidence gate |
| `packages/contracts/**` | Schema freeze — Murgesh + Vrajesh sync required |
| `mcp/server.ts` | MCP tools |
| `audit/audit_log.ts` | Append-only audit trail |
| Function signatures in your two files | Orchestrator expects exact shapes |
| Imports outside your seam zone | Already set up correctly |

---

## How to Test Your Work

### Start the service

```bash
# from repo root
npm run dev
```

### Live run (uses your 01_read.ts)

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"image":"<base64_or_path>","domain":"bill"}'
```

### Inspect the response

Look at the `RunResponse` JSON:

```jsonc
{
  "run_id": "...",
  "extracted_fields": [ /* your output from 01_read.ts */ ],
  "proof_cards": [ /* gap detection results */ ],
  "hold": { /* or null */ },
  "draft": {
    "text": "...",          /* your output from 06_draft.ts */
    "banner": "AI-generated — review before sending"
  },
  "audit": [ /* every pipeline event */ ]
}
```

### Seed paths (no real image needed)

```bash
# Trap bill — exercises gap detection and hold placement
curl "http://localhost:3000/run?seed=trap"

# Clean bill — proves engine does NOT flag correct bills
curl "http://localhost:3000/run?seed=control"
```

### TypeScript compile check

```bash
npm run typecheck
# or
npx tsc --noEmit
```

Zero errors expected before and after your changes.

---

## Summary — Ajit's Contract

| | `01_read.ts` | `06_draft.ts` |
|---|---|---|
| **Input** | `RunRequest { image, domain }` | `ProofCard[], HoldEvent\|null, string` |
| **Output** | `ExtractedField[]` (after `applyConfidenceGate`) | `Draft { text, banner }` |
| **IBM tech** | IBM Docling (PDF/image) | IBM Granite (language model) |
| **Fallback** | Return `[]` on error | `templateFillStub` already in file |
| **Must never** | Hardcode 0.90 threshold | Omit banner / output numbers not in cards |
| **Seam zone** | Between `AJIT SEAM — START/END` markers | Between `AJIT SEAM — START/END` markers |

---

*Built with IBM Bob — AI SDLC Partner.*
*Pramaan · HackVerse Track 3 · One engine. Proof, not opinions.*
