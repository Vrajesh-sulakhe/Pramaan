// ZERO LLM ΓÇö pure arithmetic. The verdict is arithmetic over two cited numbers. No model in this path.
// Built with IBM Bob ΓÇö AI SDLC Partner

import type { ExtractedField, RuleRow, CompareResult } from "@pramaan/contracts";

const TOLERANCE = 0;

/**
 * Unit alias map ΓÇö normalise raw OCR unit strings to canonical forms before lookup.
 * Keys are lowercase. Add entries here when Ajit's OCR emits a new unit variant.
 * NEVER change the canonical values ("per tablet", "per strip", etc.) ΓÇö the
 * normalizeToBaseUnit function and the rulebook stubs use those strings.
 */
const UNIT_ALIASES: Record<string, string> = {
  // tablet variants
  "tab":          "per tablet",
  "tabs":         "per tablet",
  "tablet":       "per tablet",
  "tablets":      "per tablet",
  "per tab":      "per tablet",
  "per tabs":     "per tablet",
  // strip variants
  "strip":        "per strip",
  "strips":       "per strip",
  // scan / procedure
  "scan":         "per scan",
  "per procedure":"per procedure",
  "procedure":    "per procedure",
  // day
  "day":          "per day",
  "daily":        "per day",
  "/day":         "per day",
  // test / pathology
  "test":         "per test",
  "per report":   "per test",
  // ml variants
  "ml":           "per ml",
  "per ml":       "per ml",
  "/ml":          "per ml",
  "per 100ml":    "per 100ml",
  "/100ml":       "per 100ml",
  "100ml":        "per 100ml",
};

/** Resolve a raw unit string through the alias map. Returns the canonical string or the original. */
function resolveUnit(raw: string): string {
  const key = raw.toLowerCase().trim();
  return UNIT_ALIASES[key] ?? key;
}

/**
 * Normalize a canonical unit+value to the shared base unit for comparison.
 * Returns null if units cannot be safely compared (triggers "unverified").
 *
 * Base units:
 *   medications  ΓåÆ per tablet  (per strip ├╖ 10)
 *   radiology    ΓåÆ per scan    (identity)
 *   pathology    ΓåÆ per test    (identity)
 *   ward/nursing ΓåÆ per day     (identity)
 *   liquids      ΓåÆ per ml      (per 100ml ├╖ 100)
 *   procedures   ΓåÆ per procedure (identity)
 *   unknown      ΓåÆ null        ΓåÆ "unverified"
 */
function normalizeToBaseUnit(value: number, unit: string): number | null {
  const u = resolveUnit(unit);
  if (u === "per tablet" || u === "per scan" || u === "per test" || u === "per day" || u === "per procedure") return value;
  if (u === "per strip")  return value / 10;
  if (u === "per ml")     return value;
  if (u === "per 100ml")  return value / 100;
  // Unknown unit ΓÇö cannot safely compare
  return null;
}

/**
 * Find the first matching RuleRow for a field.
 * Matches if any match_term is a case-insensitive substring of field.text.
 * Returns undefined if no rule applies.
 */
function findRule(
  fieldText: string,
  rules: Map<string, RuleRow>
): RuleRow | undefined {
  const lower = fieldText.toLowerCase();
  for (const rule of rules.values()) {
    if (rule.match_terms.some((term) => lower.includes(term.toLowerCase()))) {
      return rule;
    }
  }
  return undefined;
}

/**
 * COMPARE step ΓÇö pure function, no side effects, no I/O, no model.
 *
 * For each extracted field:
 *   - No matching rule ΓåÆ skip silently (silence over a false alarm)
 *   - Lease rule (no official_value) ΓåÆ "unverified"
 *   - UNVERIFIED rule ΓåÆ "unverified"
 *   - null value ΓåÆ "unverified"
 *   - Unit mismatch/unknown ΓåÆ "unverified"
 *   - gap = field.value - rule.official_value
 *   - gap > TOLERANCE ΓåÆ "gap", else "ok"
 */
export function compare(
  fields: ExtractedField[],
  rules: Map<string, RuleRow>
): CompareResult[] {
  const results: CompareResult[] = [];

  for (const field of fields) {
    const rule = findRule(field.text, rules);

    // No rule ΓåÆ skip silently
    if (!rule) continue;

    // Lease rule has no official_value ΓÇö emit unverified with rule context
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

    // UNVERIFIED rule ΓåÆ unverified
    if (rule.status === "UNVERIFIED") {
      results.push({
        field,
        your_value: field.value ?? 0,
        official_value: rule.official_value,
        gap: 0,
        status: "unverified",
      });
      continue;
    }

    // Null value ΓåÆ unverified
    if (field.value === null) {
      results.push({
        field,
        your_value: 0,
        official_value: rule.official_value,
        gap: 0,
        status: "unverified",
      });
      continue;
    }

    // Unit normalization ΓÇö NEVER subtract per-tablet from line-total
    const normalizedFieldValue = field.unit
      ? normalizeToBaseUnit(field.value, field.unit)
      : field.value; // no unit on field ΓÇö assume same base as rule

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

  return results;
}
