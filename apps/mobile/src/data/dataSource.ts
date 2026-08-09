// apps/mobile/src/data/dataSource.ts
import { RunResponse, AuditEvent, generateDynamicMockRun, mockConsentResponse } from './mockRun';
import { apiClient } from './apiClient'; // Your real HTTP fetcher

// THE SWITCH: Read from .env (default to 'mock' so you never crash)
const MODE = import.meta.env.VITE_RUN_MODE || 'mock';

export async function fetchRun(input: {
  image?: string;
  domain: 'bill' | 'lease';
  captureType?: string | null;
  captureData?: string | null;
  seed?: 'trap';
}): Promise<RunResponse> {
  // --- MODE A: MOCK (Build Phase) ---
  if (MODE === 'mock') {
    console.log('[DataSource] MOCK MODE: Generating dynamic mock data');
    await new Promise((r) => setTimeout(r, 800));
    return generateDynamicMockRun(input.domain, input.captureType || null, input.captureData || null);
  }

  // --- MODE B: LIVE (Integration Phase) ---
  console.log('[DataSource] LIVE MODE: Calling Murgesh\'s Engine');

  // If seeded demo (stage), hit the deterministic endpoint
  if (input.seed) {
    return apiClient.get<RunResponse>(`/run?seed=${input.seed}&domain=${input.domain}`);
  }

  // Real live analysis
  return apiClient.post<RunResponse>('/run', input);
}

export async function consent(
  runId: string,
  action: 'confirm_hold' | 'withdraw_hold' | 'send_letter'
): Promise<{ audit: AuditEvent }> {
  if (MODE === 'mock') {
    await new Promise((r) => setTimeout(r, 400));
    return mockConsentResponse(action); // Returns a fake "audit log updated" event
  }

  return apiClient.post<{ audit: AuditEvent }>('/consent', { run_id: runId, action });
}
