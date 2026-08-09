// apps/mobile/src/data/dataSource.ts
// V-IH-1/V-IH-5: Uses structured PramaanError + retry options from apiClient.
// This file is the ONLY place that maps the engine contract → UI RunResponse.
// NEVER recompute gaps, hold status, or draft text here. Render verbatim.

import { RunResponse, AuditEvent, generateDynamicMockRun, mockConsentResponse } from './mockRun';
import { apiClient, PramaanError } from './apiClient';
export { PramaanError };

// THE SWITCH: Read from .env.local (default 'live' — set 'mock' for offline dev)
const MODE = import.meta.env.VITE_RUN_MODE || 'live';

// ─── Engine contract (what Murgesh's POST /run actually returns) ───────────
interface EngineRunResponse {
  id: string;
  extracted_fields?: Array<{
    id: string;
    value: string;
    bbox: [number, number, number, number];
    low_conf: boolean;
  }>;
  proof_cards?: Array<{
    id: string;
    status: 'gap' | 'ok' | 'unverified';
    item_name: string;
    your_value: string;
    official_value: string;
    gap: string;
    rule_says_plain: string;
    source_anchor: { ref: string; url?: string };
    rule_anchor: { ref: string; url?: string };
  }>;
  hold?: null | {
    status: 'staged' | 'placed' | 'released';
    amount: string;
  };
  draft?: {
    text?: string;
    banner?: string;
  } | null;
  audit?: Array<{
    id: string;
    ts: string;
    t: string;
    payload: string;
  }>;
}

// V-IH-2: Map engine response → UI RunResponse with full defensive fallbacks.
// Every array access uses ?. and ?? to prevent any crash on partial data.
function mapEngineResponse(raw: EngineRunResponse): RunResponse {
  console.log('[DataSource] raw engine response:', raw);

  return {
    id: raw.id ?? `fallback-${Date.now()}`,

    // V-IH-2: extracted_fields === [] → UI shows "No text detected" state
    fields: (raw.extracted_fields ?? []).map(f => ({
      id: f.id ?? '',
      value: f.value ?? '',
      bbox: f.bbox ?? [0, 0, 0, 0],
      low_conf: f.low_conf ?? false,
    })),

    // V-IH-2: proof_cards === [] → UI shows "No issues found" state
    proofs: (raw.proof_cards ?? []).map(p => ({
      id: p.id ?? '',
      status: p.status ?? 'unverified',
      itemName: p.item_name ?? 'Unknown item',
      sourceLabel: 'Your Bill',
      sourceValue: p.your_value ?? '—',
      sourceRef: p.source_anchor?.ref ?? '',
      sourceRefUrl: p.source_anchor?.url,
      computeLabel: 'Gap',
      computeValue: p.gap ?? '—',
      ruleLabel: 'Official Rate',
      ruleValue: p.official_value ?? '—',
      ruleRefText: p.rule_anchor?.ref ?? '',
      ruleRefUrl: p.rule_anchor?.url,
      summaryText: p.rule_says_plain ?? '',
    })),

    // V-IH-2: hold === null | undefined → null (UI renders "No hold" chip)
    hold: raw.hold ?? null,

    // V-IH-2: draft === null | empty → '' (UI renders "No draft available")
    draftText: raw.draft?.text ?? '',
    draftBanner: raw.draft?.banner ?? 'AI-generated — review before sending',

    // V-IH-2: audit === [] → UI renders "Audit trail will appear after analysis."
    audit: (raw.audit ?? []).map(a => ({
      id: a.id ?? '',
      ts: new Date(a.ts ?? Date.now()),
      t: a.t ?? '',
      payload: a.payload ?? '',
    })),
  };
}

interface FetchRunCallbacks {
  onRetry?: (attempt: number) => void;
}

export async function fetchRun(
  input: {
    image?: string;
    domain: 'bill' | 'lease';
    captureType?: string | null;
    captureData?: string | null;
    seed?: 'trap';
  },
  callbacks?: FetchRunCallbacks,
): Promise<RunResponse> {
  // ── MOCK MODE (offline / no engine) ───────────────────────────────────────
  if (MODE === 'mock') {
    console.log('[DataSource] MOCK MODE: Generating dynamic mock data');
    await new Promise((r) => setTimeout(r, 800));
    return generateDynamicMockRun(input.domain, input.captureType || null, input.captureData || null);
  }

  // ── LIVE MODE: Murgesh's engine is authoritative ───────────────────────────
  console.log('[DataSource] LIVE MODE: Calling Murgesh\'s Engine at', import.meta.env.VITE_BRAIN_URL);

  // V-IH-1 HARD RULE: NEVER call /run with image: null
  const hasImage = input.captureType === 'image' || input.captureType === 'camera' || input.captureType === 'file';
  if (hasImage && !input.captureData) {
    throw new PramaanError(
      'Please capture a photo before analysing.',
      'INVALID_IMAGE',
      0,
    );
  }

  const retryOpts = { retries: 3, onRetry: callbacks?.onRetry };

  // Deterministic demo seed (GET /run?seed=trap) — byte-identical payload
  if (input.seed) {
    const raw = await apiClient.get<EngineRunResponse>(
      `/run?seed=${input.seed}&domain=${input.domain}`,
      retryOpts,
    );
    return mapEngineResponse(raw);
  }

  // Real analysis: POST /run with { image, domain } or { text, domain }
  const body: Record<string, string | undefined> = { domain: input.domain };
  if (hasImage) {
    body.image = input.captureData!;
  } else {
    body.text = input.captureData ?? undefined;
  }

  // V-IH-5: /run retries up to 3×; /consent does NOT retry
  const raw = await apiClient.post<EngineRunResponse>('/run', body, retryOpts);
  return mapEngineResponse(raw);
}

// V-IH-5: /consent is NEVER retried — idempotency risk
export async function consent(
  runId: string,
  action: 'confirm_hold' | 'withdraw_hold' | 'send_letter',
): Promise<{ audit: AuditEvent }> {
  if (MODE === 'mock') {
    await new Promise((r) => setTimeout(r, 400));
    return mockConsentResponse(action);
  }

  console.log('[DataSource] POST /consent', { run_id: runId, action });
  const raw = await apiClient.post<{ audit: { id: string; ts: string; t: string; payload: string } }>(
    '/consent',
    { run_id: runId, action },
    { retries: 1 },   // retries:1 = single attempt, no retry
  );
  return {
    audit: {
      id: raw.audit.id,
      ts: new Date(raw.audit.ts),
      t: raw.audit.t,
      payload: raw.audit.payload,
    },
  };
}

interface FetchAuditCallbacks {
  onRetry?: (attempt: number) => void;
}

// V-IH-5: /audit retries up to 3×
export async function fetchAudit(
  runId: string,
  callbacks?: FetchAuditCallbacks,
): Promise<AuditEvent[]> {
  if (MODE === 'mock') {
    console.log('[DataSource] MOCK fetchAudit — no-op');
    return [];
  }

  console.log('[DataSource] GET /audit/', runId);
  const raw = await apiClient.get<Array<{ id: string; ts: string; t: string; payload: string }>>(
    `/audit/${runId}`,
    { retries: 3, onRetry: callbacks?.onRetry },
  );
  return (raw ?? []).map(a => ({ id: a.id, ts: new Date(a.ts), t: a.t, payload: a.payload }));
}
