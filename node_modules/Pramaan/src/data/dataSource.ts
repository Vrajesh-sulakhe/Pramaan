// apps/mobile/src/data/dataSource.ts
// V-1: flipped to LIVE mode — talks to Murgesh's engine at VITE_BRAIN_URL.
// This file is the ONLY place that maps the engine contract → UI RunResponse.
// NEVER recompute gaps, hold status, or draft text here. Render verbatim.

import { RunResponse, AuditEvent, generateDynamicMockRun, mockConsentResponse } from './mockRun';
import { apiClient } from './apiClient';

// THE SWITCH: Read from .env.local (default 'live' — set 'mock' for offline dev)
const MODE = import.meta.env.VITE_RUN_MODE || 'live';

// ─── Engine contract (what Murgesh's POST /run actually returns) ───────────
interface EngineRunResponse {
  id: string;
  extracted_fields: Array<{
    id: string;
    value: string;
    bbox: [number, number, number, number];
    low_conf: boolean;
  }>;
  proof_cards: Array<{
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
  hold: null | {
    status: 'staged' | 'placed' | 'released';
    amount: string;
  };
  draft: {
    text: string;
    banner: string;
  };
  audit: Array<{
    id: string;
    ts: string;
    t: string;
    payload: string;
  }>;
}

// Map engine response → UI RunResponse (single translation point)
function mapEngineResponse(raw: EngineRunResponse): RunResponse {
  console.log('[DataSource] raw engine response:', raw);

  return {
    id: raw.id,
    // V-3: bbox overlay fields
    fields: raw.extracted_fields.map(f => ({
      id: f.id,
      value: f.value,
      bbox: f.bbox,
      low_conf: f.low_conf,
    })),
    // V-2: proof cards — render verbatim, never recompute
    proofs: raw.proof_cards.map(p => ({
      id: p.id,
      status: p.status,
      itemName: p.item_name,
      sourceLabel: 'Your Bill',
      sourceValue: p.your_value,
      sourceRef: p.source_anchor.ref,
      sourceRefUrl: p.source_anchor.url,
      computeLabel: 'Gap',
      computeValue: p.gap,
      ruleLabel: 'Official Rate',
      ruleValue: p.official_value,
      ruleRefText: p.rule_anchor.ref,
      ruleRefUrl: p.rule_anchor.url,
      // V-2: rule_says_plain is Manas's human-readable rule line
      summaryText: p.rule_says_plain,
    })),
    // V-4: hold — null is valid, render "No hold" state
    hold: raw.hold ?? null,
    // V-5: draft — render verbatim + mandatory banner
    draftText: raw.draft?.text ?? '',
    draftBanner: raw.draft?.banner ?? 'AI-generated — review before sending',
    // V-6: audit events with ISO ts → Date
    audit: raw.audit.map(a => ({
      id: a.id,
      ts: new Date(a.ts),
      t: a.t,
      payload: a.payload,
    })),
  };
}

export async function fetchRun(input: {
  image?: string;
  domain: 'bill' | 'lease';
  captureType?: string | null;
  captureData?: string | null;
  seed?: 'trap';
}): Promise<RunResponse> {
  // ── MOCK MODE (offline / no engine) ───────────────────────────────────────
  if (MODE === 'mock') {
    console.log('[DataSource] MOCK MODE: Generating dynamic mock data');
    await new Promise((r) => setTimeout(r, 800));
    return generateDynamicMockRun(input.domain, input.captureType || null, input.captureData || null);
  }

  // ── LIVE MODE: Murgesh's engine is authoritative ───────────────────────────
  console.log('[DataSource] LIVE MODE: Calling Murgesh\'s Engine at', import.meta.env.VITE_BRAIN_URL);

  // V-1 HARD RULE: NEVER call /run with image: null
  const hasImage = input.captureType === 'image' || input.captureType === 'camera' || input.captureType === 'file';
  if (hasImage && !input.captureData) {
    throw new Error('[DataSource] Blocked: captureType is image/camera/file but captureData is empty. Validate before calling fetchRun.');
  }

  // Deterministic demo seed (GET /run?seed=trap) — byte-identical payload
  if (input.seed) {
    const raw = await apiClient.get<EngineRunResponse>(`/run?seed=${input.seed}&domain=${input.domain}`);
    return mapEngineResponse(raw);
  }

  // Real analysis: POST /run with { image, domain } or { text, domain }
  const body: Record<string, string | undefined> = { domain: input.domain };
  if (hasImage) {
    body.image = input.captureData!;
  } else {
    body.text = input.captureData ?? undefined;
  }

  const raw = await apiClient.post<EngineRunResponse>('/run', body);
  return mapEngineResponse(raw);
}

export async function consent(
  runId: string,
  action: 'confirm_hold' | 'withdraw_hold' | 'send_letter'
): Promise<{ audit: AuditEvent }> {
  if (MODE === 'mock') {
    await new Promise((r) => setTimeout(r, 400));
    return mockConsentResponse(action);
  }

  console.log('[DataSource] POST /consent', { run_id: runId, action });
  const raw = await apiClient.post<{ audit: { id: string; ts: string; t: string; payload: string } }>(
    '/consent',
    { run_id: runId, action }
  );
  // Map ISO ts string → Date
  return {
    audit: {
      id: raw.audit.id,
      ts: new Date(raw.audit.ts),
      t: raw.audit.t,
      payload: raw.audit.payload,
    },
  };
}

export async function fetchAudit(runId: string): Promise<AuditEvent[]> {
  if (MODE === 'mock') {
    console.log('[DataSource] MOCK fetchAudit — no-op');
    return [];
  }

  console.log('[DataSource] GET /audit/', runId);
  const raw = await apiClient.get<Array<{ id: string; ts: string; t: string; payload: string }>>(
    `/audit/${runId}`
  );
  return raw.map(a => ({ id: a.id, ts: new Date(a.ts), t: a.t, payload: a.payload }));
}
