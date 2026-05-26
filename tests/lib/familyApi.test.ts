import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncPetSnapshot, FamilyApiError, type PetSnapshotPayload } from '../../src/lib/familyApi';

const originalFetch = globalThis.fetch;

function mockClerkSession(token: string | null) {
  (window as unknown as { Clerk?: unknown }).Clerk = token
    ? { session: { getToken: async () => token } }
    : undefined;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const snap: PetSnapshotPayload = {
  line: 'galaxy',
  stage: 1,
  lineage_id: 'lin_1',
  sprite_state: {},
};

beforeEach(() => {
  mockClerkSession('tok');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  delete (window as unknown as { Clerk?: unknown }).Clerk;
});

describe('syncPetSnapshot', () => {
  it('resolves silently on 204', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    await expect(syncPetSnapshot(snap)).resolves.toBeUndefined();
  });

  it('throws FamilyApiError with status 400 on bad request', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(400, { error: 'invalid_payload' })) as unknown as typeof fetch;
    try {
      await syncPetSnapshot(snap);
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(FamilyApiError);
      expect((err as FamilyApiError).status).toBe(400);
      expect((err as FamilyApiError).message).toContain('invalid_payload');
    }
  });

  it('throws FamilyApiError with status 500 on server error', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(500, { error: 'boom' })) as unknown as typeof fetch;
    try {
      await syncPetSnapshot(snap);
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(FamilyApiError);
      expect((err as FamilyApiError).status).toBe(500);
      expect((err as FamilyApiError).message).toContain('boom');
    }
  });
});
