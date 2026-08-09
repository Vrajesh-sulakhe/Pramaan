// Built with IBM Bob — AI SDLC Partner

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { RuleRow } from "@pramaan/contracts";
import { BILL_RULEBOOK_STUB } from "../../seeds/rulebook_stub.js";
import { LEASE_RULEBOOK_STUB } from "../../seeds/rulebook_lease_stub.js";

/**
 * Noise tokens stripped before tokenized matching.
 * These are common OCR artifacts and unit suffixes that obscure meaningful terms.
 */
const NOISE_TOKENS = new Set([
  "mg", "ml", "mcg", "iu", "gm", "gms",
  "x10", "x30", "x100", "x5", "x15", "x20",
  "tab", "tabs", "cap", "caps", "inj", "amp",
  "no", "no.", "sr", "dr", "rs", "/-",
]);

/**
 * Tokenize OCR text: split on whitespace and punctuation, lowercase, strip noise.
 * Returns a deduplicated set of meaningful tokens.
 * Example: "Paracetamol 500mg x30 Tab" → ["paracetamol", "500mg", "500"]
 *   (numeric tokens kept because some match_terms include dose numbers)
 */
function tokenize(text: string): Set<string> {
  const raw = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  const tokens = new Set<string>();
  for (const t of raw) {
    if (!t || NOISE_TOKENS.has(t)) continue;
    tokens.add(t);
    // Also add the stripped-of-trailing-digits form ("500mg" → "mg" already handled; keep "500")
    const numericOnly = t.replace(/[^0-9]/g, "");
    if (numericOnly && numericOnly !== t) tokens.add(numericOnly);
  }
  return tokens;
}

/**
 * Load the rulebook for a given domain.
 * Uses the real file from packages/rulebooks/ if present; otherwise falls back to the internal stub.
 */
export function loadRulebook(domain: "bill" | "lease"): RuleRow[] {
  const realPath = resolve(
    process.cwd(),
    "packages",
    "rulebooks",
    domain === "bill" ? "bill_rules.json" : "lease_rules.json"
  );

  if (existsSync(realPath)) {
    try {
      const raw = readFileSync(realPath, "utf-8");
      const parsed = JSON.parse(raw) as RuleRow[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // Fall through to stub
    }
  }

  return domain === "bill" ? BILL_RULEBOOK_STUB : LEASE_RULEBOOK_STUB;
}

/**
 * lookup_rule — two-pass fuzzy match for real-world OCR text.
 *
 * Pass 1 (substring): standard case-insensitive substring match against full text.
 * Pass 2 (token):     tokenize the OCR text, match any token against any match_term token.
 *                     Handles "Paracetamol 500mg x30 Tab" → matches "paracetamol".
 *
 * Returns ALL matching rules (a field can match more than one rule).
 * Returns [] on no match — NEVER throws.
 */
export function lookupRule(domain: "bill" | "lease", text: string): RuleRow[] {
  if (!text || text.trim().length === 0) return [];

  const rulebook = loadRulebook(domain);
  const lower = text.toLowerCase();
  const tokens = tokenize(text);

  const matched = new Set<RuleRow>();

  for (const row of rulebook) {
    // Pass 1: substring match (original behaviour — fast path)
    if (row.match_terms.some((term) => lower.includes(term.toLowerCase()))) {
      matched.add(row);
      continue;
    }
    // Pass 2: token match — any match_term token present in the OCR token set
    for (const term of row.match_terms) {
      const termTokens = tokenize(term);
      for (const tt of termTokens) {
        if (tokens.has(tt)) {
          matched.add(row);
          break;
        }
      }
      if (matched.has(row)) break;
    }
  }

  return [...matched];
}
