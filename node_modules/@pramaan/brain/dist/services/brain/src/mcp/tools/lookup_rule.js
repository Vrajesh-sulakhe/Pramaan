// Built with IBM Bob — AI SDLC Partner
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { BILL_RULEBOOK_STUB } from "../../seeds/rulebook_stub.js";
import { LEASE_RULEBOOK_STUB } from "../../seeds/rulebook_lease_stub.js";
/**
 * Load the rulebook for a given domain.
 * Uses the real file from packages/rulebooks/ if present; otherwise falls back to the internal stub.
 * Reading from packages/rulebooks/ is allowed — Murgesh consumes Manas's data, does not write to it.
 */
export function loadRulebook(domain) {
    const realPath = resolve(process.cwd(), "packages", "rulebooks", domain === "bill" ? "bill_rules.json" : "lease_rules.json");
    if (existsSync(realPath)) {
        try {
            const raw = readFileSync(realPath, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0)
                return parsed;
        }
        catch {
            // Fall through to stub
        }
    }
    // Return internal stub
    return domain === "bill" ? BILL_RULEBOOK_STUB : LEASE_RULEBOOK_STUB;
}
/**
 * lookup_rule tool handler.
 * Searches the rulebook for rows whose match_terms appear in the given text (case-insensitive).
 * Returns [] on no match — this is NOT an error.
 */
export function lookupRule(domain, text) {
    const rulebook = loadRulebook(domain);
    const lower = text.toLowerCase();
    return rulebook.filter((row) => row.match_terms.some((term) => lower.includes(term.toLowerCase())));
}
