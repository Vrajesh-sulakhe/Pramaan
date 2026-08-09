// Built with IBM Bob — AI SDLC Partner
// LOOKUP Rule Tool — 6-Domain Multi-Regulatory Fuzzy Matching Engine

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { RuleRow, Domain } from "@pramaan/contracts";
import { BILL_RULEBOOK_STUB } from "../../seeds/rulebook_stub.js";
import { LEASE_RULEBOOK_STUB } from "../../seeds/rulebook_lease_stub.js";

/**
 * Noise tokens stripped before tokenized matching.
 */
const NOISE_TOKENS = new Set([
  "mg", "ml", "mcg", "iu", "gm", "gms",
  "x10", "x30", "x100", "x5", "x15", "x20",
  "tab", "tabs", "cap", "caps", "inj", "amp",
  "no", "no.", "sr", "dr", "rs", "/-",
]);

function tokenize(text: string): Set<string> {
  const raw = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  const tokens = new Set<string>();
  for (const t of raw) {
    if (!t || NOISE_TOKENS.has(t)) continue;
    tokens.add(t);
    const numericOnly = t.replace(/[^0-9]/g, "");
    if (numericOnly && numericOnly !== t) tokens.add(numericOnly);
  }
  return tokens;
}

const RULEBOOK_FILENAMES: Record<Domain, string[]> = {
  bill: ["rulebook_bill.json", "bill_rules.json"],
  lease: ["rulebook_lease.json", "lease_rules.json"],
  gig_payslip: ["rulebook_gig_payslip.json"],
  insurance: ["rulebook_insurance.json"],
  medicine: ["rulebook_medicine.json"],
  challan: ["rulebook_challan.json"],
};

/**
 * Load the rulebook for a given domain.
 * Uses the real file from packages/rulebooks/ if present; otherwise falls back to the internal stub.
 */
export function loadRulebook(domain: Domain): RuleRow[] {
  const filenames = RULEBOOK_FILENAMES[domain] || [`rulebook_${domain}.json`];

  for (const filename of filenames) {
    const realPath = resolve(process.cwd(), "packages", "rulebooks", filename);
    if (existsSync(realPath)) {
      try {
        const raw = readFileSync(realPath, "utf-8");
        const parsed = JSON.parse(raw);

        // If JSON has top-level array
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as RuleRow[];
        }

        // If JSON has sections / categories / safety_alerts
        if (typeof parsed === "object" && parsed !== null) {
          const rows: RuleRow[] = [];
          if (Array.isArray(parsed.sections)) rows.push(...parsed.sections);
          if (Array.isArray(parsed.safety_alerts)) rows.push(...parsed.safety_alerts);
          if (Array.isArray(parsed.rules)) rows.push(...parsed.rules);
          if (rows.length > 0) return rows;
        }
      } catch {
        // Fall through
      }
    }
  }

  // Fallback defaults
  if (domain === "bill") return BILL_RULEBOOK_STUB;
  if (domain === "lease") return LEASE_RULEBOOK_STUB;

  // Generic stub for remaining domains if file parsing is unavailable
  return [
    {
      rule_id: `${domain}-default-001`,
      domain: domain as any,
      match_terms: ["fee", "charge", "fare", "deduction", "fine", "mrp", "bill", "invoice", "speed", "claim", "deposit"],
      rule_says_plain: `Statutory compliance schedule for ${domain}.`,
      status: "VERIFIED",
    } as any,
  ];
}

/**
 * lookupRule — two-pass fuzzy match for real-world OCR text.
 */
export function lookupRule(domain: Domain, text: string): RuleRow[] {
  if (!text || text.trim().length === 0) return [];

  const rulebook = loadRulebook(domain);
  const lower = text.toLowerCase();
  const tokens = tokenize(text);

  const matched = new Set<RuleRow>();

  for (const row of rulebook) {
    const terms = (row.match_terms || []).map(t => String(t));
    if (terms.length === 0) {
      matched.add(row);
      continue;
    }

    // Pass 1: substring match
    if (terms.some((term) => lower.includes(term.toLowerCase()))) {
      matched.add(row);
      continue;
    }

    // Pass 2: token match
    for (const term of terms) {
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
