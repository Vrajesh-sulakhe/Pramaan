# AJIT SEAMS — Handoff Document
> For: Ajit (SAP)
> From: Murgesh (TRUNK)
> Files you may edit: exactly 2

---

## What This Document Is

Murgesh has built the full 6-step pipeline and wired everything together. Two steps — READ (01) and DRAFT (06) — have stub bodies marked with seam markers. **You replace only those bodies.** Everything else is Murgesh's and must not be touched.

---

## The Two Files You May Edit

### 1. `services/brain/src/pipeline/steps/01_read.ts`

**Your zone:** The body between:
```
// ═══════════════ AJIT SEAM — START ═══════════════
```
and
```
// ═══════════════ AJIT SEAM — END ══════════════════
```

**Function signature (do NOT change):**
```typescript
export async function read(req: RunRequest): Promise<ExtractedField[]>
```

**What `req` contains:**
```typescript
{ image: string, domain: "bill" | "lease" }
// image is either a base64 string or a file path to a PDF
```

**What you must return** — see `@pramaan/contracts`:
```typescript
interface ExtractedField {
  text: string;
  value: number | null;
  unit: string | null;
  bbox: [number, number, number, number]; // [x, y, w, h]
  confidence: number;  // 0..1
  low_conf: boolean;
}
```

**Rules for your body:**
1. Use IBM Docling for PDFs. Tesseract.js fallback for plain images.
2. Report numbers **exactly as read** — never "fix" a shaky value. The confidence gate decides downstream.
3. **CRITICAL — confidence gate**: After extracting, call `applyConfidenceGate(fields)` from `../confidence.js` before returning. Import it: `import { applyConfidenceGate } from '../confidence.js'`. Do **NOT** reimplement the 0.90 threshold. There is exactly one confidence gate in this codebase. Two gates = two thresholds = drift between OCR and hold logic.
4. If input is blank or unreadable, return `[]`. Never throw.
5. Handle tables: hospital bills have tabular line items. Use Docling's table extraction for row-by-row data with per-cell bounding boxes.

---

### 2. `services/brain/src/pipeline/steps/06_draft.ts`

**Your zone:** The body between the seam markers (same format).

**Function signature (do NOT change):**
```typescript
export async function draft(cards: ProofCard[], hold: HoldEvent | null, template: string): Promise<Draft>
```

**What you receive** — see `@pramaan/contracts`:
- `cards: ProofCard[]` — output from the PROVE step
- `hold: HoldEvent | null` — the placed or staged hold (or null if no gap)
- `template: string` — the complaint letter template from Manas

**What you must return:**
```typescript
interface Draft {
  text: string;    // the letter body
  banner: string;  // ALWAYS "AI-generated — review before sending"
}
```

**Rules for your body:**
1. Use IBM Granite via watsonx.ai to generate wording.
2. **Granite touches WORDING only.** Every number in the letter must come from the proof cards. If Granite outputs a number not present in `cards`, discard it.
3. `banner` MUST ALWAYS be `"AI-generated — review before sending"` — even on fallback. Non-negotiable.
4. **Fallback**: If Granite fails or times out (10s), fall back to pure template-fill (string interpolation). The `templateFillStub` function in the file shows the pattern. The letter must render without a model call.
5. Only include cards with `status === "gap"` in the letter. Skip `"ok"` and `"unverified"` cards.
6. If `hold !== null`, include a line about the hold amount and auto-release time.

---

## What You Must NEVER Touch

| File / Area | Why |
|---|---|
| `services/brain/src/pipeline/orchestrator.ts` | Murgesh's wiring. Changing it breaks every step's integration. |
| `packages/contracts/types.ts` | Frozen. Changes require Murgesh + Vrajesh sync. |
| Any other step file (`02_lookup.ts`, `03_compare.ts`, `04_prove.ts`, `05_act.ts`) | Not your lane. |
| Function signatures in `01_read.ts` and `06_draft.ts` | Frozen. The orchestrator calls these by signature. |
| `services/brain/src/pipeline/confidence.ts` | Murgesh's utility. Call it, don't reimplement it. |

---

## How to Test

After filling in your bodies, the full pipeline is testable with a single HTTP call:

```bash
curl -s -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"image": "path/to/bill.pdf", "domain": "bill"}' | jq .
```

Inspect the response fields:
- `extracted_fields` — your step 01 output (should have bbox, confidence, low_conf)
- `proof_cards` — compare/prove output (gap cards should show your vs official values)
- `hold` — null (no gap), staged (low confidence gap), or placed (high confidence gap)
- `draft.text` — your step 06 output
- `draft.banner` — must always be `"AI-generated — review before sending"`
- `audit` — one entry per step; inspect the `t` values

For a quick smoke test without your real OCR/Granite, the stub bodies already return sample data. Run `GET http://localhost:3000/run?seed=trap` for the deterministic demo path.

---

## Quick Reference

```
Murgesh owns:  orchestrator, compare, prove, act, lookup, gateway, MCP, audit, confidence gate
Ajit owns:     01_read.ts body (OCR/Docling) + 06_draft.ts body (Granite/fallback)
Manas owns:    packages/rulebooks/ (real rule data), packages/templates/ (letter wording)
Vrajesh owns:  apps/ (mobile UI)
```

*Pramaan · HackVerse Track 3 · Handoff doc generated by IBM Bob*
