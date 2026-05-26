import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePyxie } from '../../src/store/usePyxie';
import { hydratePetOnce } from '../../src/hooks/usePetHydration';
import { flushPetOnce } from '../../src/hooks/usePetFlusher';
import {
  resetPetSyncState,
  getLastSignature,
  getLastVersion,
  computePetSignature,
} from '../../src/lib/petSyncState';
import { makePet } from '../helpers';
import type { Pet } from '../../src/store/types';

// ADR-009 M3 acceptance criterion: hydration must seed the flusher's sync
// cursor so the very first PUT after sign-in is NOT a redundant re-PUT of
// the state hydration just GET'd.

const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  usePyxie.setState({ pet: null, petHydrating: true });
  resetPetSyncState();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('pet sync coordination (hydration ↔ flusher)', () => {
  it('after hydration GET 200, an immediate flushPetOnce is a no-op (signature seeded)', async () => {
    const serverPet: Pet = makePet({ name: 'ServerPet', xp: 500 });
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const method = (init as RequestInit | undefined)?.method ?? 'GET';
      calls.push(method);
      if (method === 'GET') {
        return jsonResponse(200, { state: serverPet, version: 12, updatedAt: 'x' });
      }
      return jsonResponse(200, { state: {}, version: 13, updatedAt: 'x' });
    }) as unknown as typeof fetch;

    await hydratePetOnce({ fetchToken: async () => 'tok' });

    // After hydration, signature/version should match server pet
    expect(getLastSignature()).toBe(computePetSignature(serverPet));
    expect(getLastVersion()).toBe(12);
    expect(usePyxie.getState().petHydrating).toBe(false);

    // Immediate flush attempt — must NOT issue a PUT
    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('skipped');
    expect(calls).toEqual(['GET']); // only the hydration GET, no flusher PUT
  });

  it('after hydration GET 200, a subsequent local mutation DOES trigger a PUT', async () => {
    const serverPet: Pet = makePet({ name: 'ServerPet', xp: 500 });
    const calls: { method: string; body?: string }[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const i = init as RequestInit | undefined;
      const method = i?.method ?? 'GET';
      calls.push({ method, body: i?.body as string | undefined });
      if (method === 'GET') {
        return jsonResponse(200, { state: serverPet, version: 12, updatedAt: 'x' });
      }
      return jsonResponse(200, { state: {}, version: 13, updatedAt: 'x' });
    }) as unknown as typeof fetch;

    await hydratePetOnce({ fetchToken: async () => 'tok' });

    // User taps pet → happiness changes
    usePyxie.setState({ pet: { ...usePyxie.getState().pet!, happiness: 99 } });
    const result = await flushPetOnce({ fetchToken: async () => 'tok' });

    expect(result.status).toBe('sent');
    expect(calls.map((c) => c.method)).toEqual(['GET', 'PUT']);
    // PUT version should be lastVersion (12) + 1 = 13
    const putBody = JSON.parse(calls[1].body ?? '{}');
    expect(putBody.version).toBe(13);
  });

  it('after first-time migration (404+PUT), an immediate flushPetOnce is a no-op', async () => {
    const localPet: Pet = makePet({ name: 'OldLocal' });
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const method = (init as RequestInit | undefined)?.method ?? 'GET';
      calls.push(method);
      if (method === 'GET') return jsonResponse(404, { error: 'pet_not_found' });
      return jsonResponse(200, { state: localPet, version: 1, updatedAt: 'x' });
    }) as unknown as typeof fetch;

    usePyxie.setState({ pet: localPet });
    await hydratePetOnce({ fetchToken: async () => 'tok' });

    expect(calls).toEqual(['GET', 'PUT']); // migration PUT
    expect(getLastSignature()).toBe(computePetSignature(localPet));

    // Flusher should NOT push again
    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('skipped');
    expect(calls).toEqual(['GET', 'PUT']); // unchanged
  });

  it('after hydration 404 with no local pet, flusher does not push null', async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(404, { error: 'pet_not_found' })
    ) as unknown as typeof fetch;

    usePyxie.setState({ pet: null });
    await hydratePetOnce({ fetchToken: async () => 'tok' });

    expect(usePyxie.getState().pet).toBeNull();
    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('skipped');
  });
});
