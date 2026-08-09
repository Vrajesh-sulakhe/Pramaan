// Built with IBM Bob — AI SDLC Partner
// PROVE Step — 6-Domain Multi-Regulatory Proof Card Builder

import type { CompareResult, ExtractedField, RuleRow, ProofCard } from "@pramaan/contracts";

/**
 * PROVE step — assembles ProofCard[] from CompareResult[].
 * Each card carries THREE anchors:
 *   source_anchor  — from the extracted field (bbox, ocr_confidence)
 *   rule_anchor    — from the official rule source
 *   compute_anchor — the literal subtraction expression
 *
 * HARD RULE: a card with a missing rule_anchor → status "unverified", NEVER "gap".
 * No anchor = no accusation.
 */
export function prove(
  compares: CompareResult[],
  _fields: ExtractedField[],
  rules: Map<string, RuleRow>
): ProofCard[] {
  const cards: ProofCard[] = [];

  for (const cr of compares) {
    // Find the rule that matches this field (search by match_terms again)
    const fieldLower = cr.field.text.toLowerCase();
    let matchedRule: RuleRow | undefined;
    for (const rule of rules.values()) {
      if (rule.match_terms.some((t) => fieldLower.includes(t.toLowerCase()))) {
        matchedRule = rule;
        break;
      }
    }

    // HARD RULE: no rule_anchor → unverified, never gap
    if (!matchedRule) {
      cards.push({
        item: cr.field.text,
        your_value: cr.your_value,
        official_value: cr.official_value,
        gap: cr.gap,
        status: "unverified",
        source_anchor: {
          ref: `Document line: "${cr.field.text}"`,
          bbox: cr.field.bbox,
          ocr_confidence: cr.field.confidence,
        },
        rule_anchor: { ref: "unknown — no rule matched" },
        compute_anchor: `${cr.your_value} - ${cr.official_value}`,
        rule_says_plain: "",
      });
      continue;
    }

    let ruleAnchorRef = "Official Regulatory Schedule";
    let ruleAnchorUrl: string | undefined;

    if (matchedRule.domain === "bill") {
      ruleAnchorRef = matchedRule.official_source;
      ruleAnchorUrl = matchedRule.official_source_url;
    } else if (matchedRule.domain === "lease") {
      ruleAnchorRef = matchedRule.law_ref;
      ruleAnchorUrl = matchedRule.law_ref_url;
    } else if (matchedRule.domain === "gig_payslip") {
      ruleAnchorRef = matchedRule.clause_ref;
      ruleAnchorUrl = matchedRule.clause_ref_url;
    } else if (matchedRule.domain === "insurance") {
      ruleAnchorRef = matchedRule.circular_ref;
      ruleAnchorUrl = matchedRule.circular_ref_url;
    } else if (matchedRule.domain === "medicine") {
      ruleAnchorRef = `${matchedRule.source_authority} Notification`;
      ruleAnchorUrl = matchedRule.source_url;
    } else if (matchedRule.domain === "challan") {
      ruleAnchorRef = matchedRule.section_ref;
      ruleAnchorUrl = matchedRule.section_ref_url;
    }

    cards.push({
      item: cr.field.text,
      your_value: cr.your_value,
      official_value: cr.official_value,
      gap: cr.gap,
      status: cr.status,
      source_anchor: {
        ref: `Document line: "${cr.field.text}"`,
        bbox: cr.field.bbox,
        ocr_confidence: cr.field.confidence,
      },
      rule_anchor: {
        ref: ruleAnchorRef,
        url: ruleAnchorUrl,
      },
      compute_anchor: `${cr.your_value} - ${cr.official_value}`,
      rule_says_plain: matchedRule.rule_says_plain,
    });
  }

  return cards;
}
