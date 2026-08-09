// IBM: watsonx Orchestrate / Agent Lab — 6-step agent flow
// Built with IBM Bob — AI SDLC Partner
import { auditLog } from "../audit/audit_log.js";
import { read } from "./steps/01_read.js";
import { lookup } from "./steps/02_lookup.js";
import { compare } from "./steps/03_compare.js";
import { prove } from "./steps/04_prove.js";
import { act } from "./steps/05_act.js";
import { draft } from "./steps/06_draft.js";
const STEP_TIMEOUT_MS = 10_000;
/** Wraps a promise with a timeout. Rejects if the step takes longer than timeoutMs. */
function withTimeout(promise, timeoutMs, stepName) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Step ${stepName} timed out after ${timeoutMs}ms`)), timeoutMs)),
    ]);
}
/**
 * Orchestrate the 6-step Pramaan trunk.
 * Threads accumulated state through steps sequentially.
 * On any step error: append "error" audit event, return partial RunResponse. Never throws.
 */
export async function orchestrate(req) {
    const run_id = crypto.randomUUID();
    // Use image path as a stand-in invoice_id; a real system would parse it from the document
    const invoice_id = `inv-${run_id.slice(0, 8)}`;
    const state = {
        fields: [],
        rules: new Map(),
        gaps: [],
        cards: [],
        hold: null,
        draft: { text: "", banner: "AI-generated — review before sending" },
    };
    const steps = [
        {
            name: "ocr",
            run: async () => {
                state.fields = await read(req);
            },
        },
        {
            name: "lookup",
            run: async () => {
                state.rules = await lookup(state.fields, req.domain);
            },
        },
        {
            name: "compare",
            run: async () => {
                // compare is synchronous but wrapped for uniform try/catch
                state.gaps = compare(state.fields, state.rules);
            },
        },
        {
            name: "prove",
            run: async () => {
                state.cards = prove(state.gaps, state.fields, state.rules);
            },
        },
        {
            name: "hold_placed", // adjusted to actual value in step 05
            run: async () => {
                state.hold = await act(state.cards, invoice_id);
                // audit event already appended by act() itself; skip double-append here
            },
            skipAudit: true,
        },
        {
            name: "draft",
            run: async () => {
                state.draft = await draft(state.cards, state.hold, "");
            },
        },
    ];
    for (const step of steps) {
        try {
            await withTimeout(step.run(), STEP_TIMEOUT_MS, step.name);
            if (!step.skipAudit) {
                auditLog.append({
                    t: step.name,
                    run_id,
                    ts: new Date().toISOString(),
                    payload: { step: step.name, field_count: state.fields.length, card_count: state.cards.length },
                });
            }
        }
        catch (e) {
            auditLog.append({
                t: "error",
                run_id,
                ts: new Date().toISOString(),
                payload: {
                    step: step.name,
                    error: e instanceof Error ? e.message : String(e),
                },
            });
            // Partial response — return what we have so far
            break;
        }
    }
    return {
        run_id,
        domain: req.domain,
        extracted_fields: state.fields,
        proof_cards: state.cards,
        hold: state.hold,
        draft: state.draft,
        audit: auditLog.list(run_id),
    };
}
