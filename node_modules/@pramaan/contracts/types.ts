// FROZEN @ P1 — 2026-08-09 — Changes require Murgesh + Vrajesh sync (sprint rule #1).
// 10 exported types. PipelineState is internal to orchestrator — NOT exported here.

export interface ExtractedField {
  text: string;
  value: number | null;
  unit: string | null;
  bbox: [number, number, number, number]; // [x, y, w, h]
  confidence: number; // 0..1
  low_conf: boolean;
}

// RuleRow — discriminated union on domain
export type RuleRow = BillRuleRow | LeaseRuleRow;

export interface BillRuleRow {
  rule_id: string;
  domain: "bill";
  item_category: string;
  match_terms: string[];
  procedure_code: string;
  official_value: number;
  official_unit: string;
  official_source: string;
  official_source_url: string;
  rule_says_plain: string;
  severity: "high" | "medium";
  status: "VERIFIED" | "UNVERIFIED";
  notes: string;
}

export interface LeaseRuleRow {
  rule_id: string;
  domain: "lease";
  clause_type: string;
  match_terms: string[];
  legal_status: "illegal" | "risky" | "info";
  law_ref: string;
  law_ref_url: string;
  rule_says_plain: string;
  suggested_fix_plain: string;
  status: "VERIFIED" | "UNVERIFIED";
}

export interface ProofCard {
  item: string;
  your_value: number;
  official_value: number;
  gap: number;
  status: "gap" | "ok" | "unverified";
  source_anchor: {
    ref: string;
    bbox?: [number, number, number, number];
    ocr_confidence?: number;
  };
  rule_anchor: {
    ref: string;
    url?: string;
  };
  compute_anchor: string; // e.g. "45 - 2"
  rule_says_plain: string;
}

export interface HoldEvent {
  hold_id: string;
  invoice_id: string;
  amount: number;
  status: "staged" | "placed" | "released";
  reversible: boolean;
  expires_at: string | null;
  placed_by: "auto" | "user";
  confidence_floor: number;
}

export interface AuditEvent {
  t:
    | "ocr"
    | "lookup"
    | "compare"
    | "prove"
    | "hold_placed"
    | "hold_staged"
    | "hold_released"
    | "draft"
    | "consent"
    | "error";
  run_id: string;
  ts: string;
  payload: object;
}

export interface RunRequest {
  image: string;
  domain: "bill" | "lease";
}

export interface RunResponse {
  run_id: string;
  domain: string;
  extracted_fields: ExtractedField[];
  proof_cards: ProofCard[];
  hold: HoldEvent | null;
  draft: { text: string; banner: string };
  audit: AuditEvent[];
}

export interface CompareResult {
  field: ExtractedField;
  your_value: number;
  official_value: number;
  gap: number;
  status: "gap" | "ok" | "unverified";
}

export interface Draft {
  text: string;
  banner: string;
}

export type Domain = "bill" | "lease";
