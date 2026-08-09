// apps/mobile/src/data/apiClient.ts
// Real HTTP client that talks to Murgesh's engine at VITE_BRAIN_URL.
// Do NOT edit services/brain/** — this is the UI-side caller only.

const BASE_URL = (import.meta.env.VITE_BRAIN_URL as string) || 'http://localhost:3000';

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const url = `${BASE_URL}${path}`;
    console.log('[apiClient] GET', url);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`GET ${url} → HTTP ${res.status}`);
    }
    const json: T = await res.json();
    console.log('[apiClient] GET response:', json);
    return json;
  },

  post: async <T>(path: string, data: unknown): Promise<T> => {
    const url = `${BASE_URL}${path}`;
    console.log('[apiClient] POST', url, data);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`POST ${url} → HTTP ${res.status}`);
    }
    const json: T = await res.json();
    console.log('[apiClient] POST response:', json);
    return json;
  },
};
