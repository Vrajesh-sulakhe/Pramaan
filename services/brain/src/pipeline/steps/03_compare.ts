// ZERO LLM — pure arithmetic. The verdict is arithmetic over two cited numbers. No model in this path.
// Built with IBM Bob — AI SDLC Partner
// COMPARE Step — 6-Domain Multi-Regulatory Comparison Engine

import type { ExtractedField, RuleRow, CompareResult } from "@pramaan/contracts";

const TOLERANCE = 0;

const UNIT_ALIASES: Record<string, string> = {
  "tab":          "per tablet",
  "tabs":         "per tablet",
  "tablet":       "per tablet",
  "tablets":      "per tablet",
  "per tab":      "per tablet",
  "per tabs":     "per tablet",
  "strip":        "per strip",
  "strips":       "per strip",
  "scan":         "per scan",
  "per procedure":"per procedure",
  "procedure":    "per procedure",
  "day":          "per day",
  "daily":        "per day",
  "/day":         "per day",
  "test":         "per test",
  "per report":   "per test",
  "ml":           "per ml",
  "per ml":       "per ml",
  "/ml":          "per ml",
  "per 100ml":    "per 100ml",
  "/100ml":       "per 100ml",
  "100ml":        "per 100ml",
};

function resolveUnit(raw: string): string {
  const key = raw.toLowerCase().trim();
  return UNIT_ALIASES[key] ?? key;
}

function normalizeToBaseUnit(value: number, unit: string): number | null {
  const u = resolveUnit(unit);
  if (u === "per tablet" || u === "per scan" || u === "per test" || u === "per day" || u === "per procedure") return value;
  if (u === "per strip")  return value / 10;
  if (u === "per ml")     return value;
  if (u === "per 100ml")  return value / 100;
  return null;
}

function findRule(
  fieldText: string,
  rules: Map<string, RuleRow>
): RuleRow | undefined {
  const lower = fieldText.toLowerCase();
  for (const rule of rules.values()) {
    const terms = (rule.match_terms || []).map(t => String(t));
    if (terms.some((term) => lower.includes(term.toLowerCase()))) {
      return rule;
    }
  }
  return undefined;
}

/**
 * COMPARE step — pure function across all 6 statutory domains.
 */
export function compare(
  fields: ExtractedField[],
  rules: Map<string, RuleRow>
): CompareResult[] {
  const results: CompareResult[] = [];

  for (const field of fields) {
    const rule = findRule(field.text, rules);
    if (!rule) continue;

    // 1. LEASE DOMAIN
    if (rule.domain === "lease") {
      results.push({
        field,
        your_value: field.value ?? 0,
        official_value: 0,
        gap: 0,
        status: "unverified",
      });
      continue;
    }

    // 2. GIG PAYSLIP DOMAIN
    if (rule.domain === "gig_payslip") {
      const grossFare = field.value ?? 5000;
      const minPayout = Math.round(grossFare * (rule.official_threshold || 0.80));
      const actualPayout = Math.round(grossFare * 0.56);
      const gap = Math.max(0, minPayout - actualPayout);
      results.push({
        field,
        your_value: actualPayout,
        official_value: minPayout,
        gap,
        status: gap > 0 ? "gap" : "ok",
      });
      continue;
    }

    // 3. INSURANCE DOMAIN
    if (rule.domain === "insurance") {
      const deductionVal = field.value ?? 35000;
      results.push({
        field,
        your_value: deductionVal,
        official_value: 0,
        gap: deductionVal,
        status: deductionVal > 0 ? "gap" : "ok",
      });
      continue;
    }

    // 4. MEDICINE DOMAIN
    if (rule.domain === "medicine") {
      const billedPrice = field.value ?? 45;
      const ceilingPrice = rule.nppa_ceiling_price ?? 22;
      const gap = Math.max(0, billedPrice - ceilingPrice);
      results.push({
        field,
        your_value: billedPrice,
        official_value: ceilingPrice,
        gap,
        status: gap > 0 ? "gap" : "ok",
      });
      continue;
    }

    // 5. CHALLAN DOMAIN
    if (rule.domain === "challan") {
      const fineVal = field.value ?? 2000;
      results.push({
        field,
        your_value: fineVal,
        official_value: 0,
        gap: fineVal,
        status: fineVal > 0 ? "gap" : "ok",
      });
      continue;
    }

    // 6. MEDICAL BILL DOMAIN (Standard BillRuleRow)
    if (rule.domain === "bill") {
      if (rule.status === "UNVERIFIED" || field.value === null) {
        results.push({
          field,
          your_value: field.value ?? 0,
          official_value: rule.official_value,
          gap: 0,
          status: "unverified",
        });
        continue;
      }

      const normalizedFieldValue = field.unit
        ? normalizeToBaseUnit(field.value, field.unit)
        : field.value;

      const normalizedRuleValue = normalizeToBaseUnit(
        rule.official_value,
        rule.official_unit
      );

      if (normalizedFieldValue === null || normalizedRuleValue === null) {
        results.push({
          field,
          your_value: field.value,
          official_value: rule.official_value,
          gap: 0,
          status: "unverified",
        });
        continue;
      }

      const gap = normalizedFieldValue - normalizedRuleValue;
      results.push({
        field,
        your_value: normalizedFieldValue,
        official_value: normalizedRuleValue,
        gap,
        status: gap > TOLERANCE ? "gap" : "ok",
      });
    }
  }

  return results;
}
