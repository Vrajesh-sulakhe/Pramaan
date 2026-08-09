# Pramaan — Architecture
> Document extraction · Gap detection · Provisional hold · Plain-language complaint
> HackVerse Track 3 · 8–10 Aug 2026

---

## The 6-Step Trunk

```
RunRequest
{ image, domain }
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  services/brain  (IBM watsonx Orchestrate / Agent Lab)          │
│                                                                 │
│  01  READ     ──► ExtractedField[]        (IBM Docling / OCR)   │
│       │                                                         │
│  02  LOOKUP   ──► Map<fieldIdx, RuleRow>  (MCP lookup_rule)     │
│       │                                                         │
│  03  COMPARE  ──► CompareResult[]         (pure arithmetic)     │
│       │                                                         │
│  04  PROVE    ──► ProofCard[]             (3-anchor evidence)   │
│       │                                                         │
│  05  ACT      ──► HoldEvent | null        (MCP place_hold)      │
│       │                                                         │
│  06  DRAFT    ──► { text, banner }        (IBM Granite)         │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
RunResponse
{ run_id, extracted_fields, proof_cards, hold, draft, audit }
```

Each step reads accumulated state; no step reaches back into an earlier step's internals.

---

## IBM Stack Mapping

| Pramaan Component | IBM Technology | File |
|---|---|---|
| 6-step agent flow | **watsonx Orchestrate / Agent Lab** | `pipeline/orchestrator.ts` |
| Tool calls (rulebook lookup, hold) | **MCP** (watsonx.data managed server) | `mcp/server.ts` |
| Document extraction | **IBM Docling** (Ajit's call) | `pipeline/steps/01_read.ts` |
| Plain-language letter generation | **IBM Granite** (Ajit's call) | `pipeline/steps/06_draft.ts` |
| Consent + audit + governance | **AgentOps** | `audit/audit_log.ts` + `/consent` |
| Rulebook and seed fixtures | **Data Prep Kit** | `seeds/*.ts` |
| Development process | **IBM Bob** (AI SDLC Partner) | This entire build |

---

## The Hallucination Defense

> **"The verdict is arithmetic over two cited numbers, computed by code with no model in the path."**

Step 03 COMPARE is a pure function: no network, no model, no side effects. It subtracts `field.value` from `rule.official_value`. Every ProofCard carries three anchors:

1. **`source_anchor`** — the exact line on the bill (with bounding box and OCR confidence)
2. **`rule_anchor`** — the official government source (CGHS rate list, NPPA DPCO, law reference)
3. **`compute_anchor`** — the literal subtraction, e.g. `"8500 - 6400"`

Anyone can re-run it. The model is physically not in the verdict path.

---

## The Agentic Statement

> **"The agent mutates external state through MCP (mock gateway for sprint; production pattern)."**

Step 05 ACT calls MCP `place_hold` — a tool that writes to the Billing Gateway's in-memory state. The hold is:
- **Provisional** (reversible)
- **Auto-expiring** (72 hours, via `tick()`)
- **High-confidence only** — if any gap card's OCR confidence is below 0.90, the hold is staged (not placed) until a human confirms via `POST /consent`

This is real agent behavior: the agent changes external state with a logged, audited, reversible action.

---

## RAG and Agentic — IBM for Both

> **"If using RAG or Agentic — IBM for both."**
> - **RAG** = retrieval over the rule corpus via MCP `lookup_rule` (served through watsonx.data managed MCP server)
> - **Agentic** = watsonx Orchestrate + MCP tools (`lookup_rule`, `place_hold`, `get_hold_status`, `release_hold`)

---

## Hold State Machine

```
(no disputed gap)                     → hold = null
gap + conf ≥ 0.90                     → PLACED  (via MCP, reversible, +72h, placed_by "auto")
gap + conf < 0.90                     → STAGED  (computed, NOT frozen in gateway)
STAGED + POST /consent confirm_hold   → PLACED  (placed_by "user")
STAGED + no tap                       → stays draft only
PLACED + 72h no confirm               → RELEASED (auto_expiry via tick)
PLACED + POST /consent confirm_hold   → PLACED  (placed_by "user", confirmed)
PLACED + POST /consent withdraw_hold  → RELEASED (user_withdraw)
```

Every transition writes an `AuditEvent`. The audit trail is append-only.

---

## API Surface

| Method | Path | Description |
|---|---|---|
| `POST` | `/run` | Live pipeline. Body: `{ image, domain }`. Returns `RunResponse`. |
| `GET` | `/run?seed=trap` | Deterministic demo path (PATH B). Byte-identical. Runs steps 02–05 live. |
| `GET` | `/run?seed=control` | Clean bill demo. Proves engine does not flag correct bills. |
| `POST` | `/consent` | Human tap. Body: `{ run_id, hold_id, action }`. |
| `GET` | `/health` | Liveness check. Returns `{ ok: true }`. |

---

## Team Boundaries

| Lane | Owner | Files |
|---|---|---|
| TRUNK (engine) | **Murgesh** | `services/brain/**`, `packages/contracts/**` |
| OCR + Granite (model calls) | **Ajit** | Bodies of `01_read.ts` and `06_draft.ts` only |
| Rulebook content | **Manas** | `packages/rulebooks/**` |
| Mobile UI | **Vrajesh** | `apps/**` |

---

## Q&A — How the Verdict Is Grounded

> The verdict is arithmetic over two cited numbers — your bill and the official rule — computed by code with no model in the path. Every card carries three anchors: your source, the official source, and the exact subtraction. Anyone can re-run it.

---

*Development process assisted by IBM Bob (AI SDLC Partner).*
*Pramaan · HackVerse Track 3 · One engine. Proof, not opinions. Built once, branches forever.*
