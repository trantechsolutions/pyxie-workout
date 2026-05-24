import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

const sqlMock = vi.fn();
vi.mock('../../api/_lib/db', () => ({
  getSql: () => sqlMock,
}));

import { verifyToken } from '@clerk/backend';
import constellationHandler, {
  __resetConstellationCacheForTests,
  invalidateFamilyCache,
} from '../../api/family/constellation';
import joinHandler from '../../api/families/join';
import membershipHandler from '../../api/families/membership';
import rotateHandler from '../../api/families/rotate-code';
import { __resetRateLimitForTests } from '../../api/_lib/rateLimit';

const verifyTokenMock = verifyToken as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    ended: false,
    status(c: number) { this.statusCode = c; return this; },
    json(p: unknown) { this.body = p; return this; },
    end() { this.ended = true; return this; },
    setHeader() { return this; },
  };
  return res as unknown as VercelResponse & { statusCode: number; body: unknown; ended: boolean };
}

function mockReq(method: string, body?: unknown, headers: Record<string, string> = {}): VercelRequest {
  return { method, headers, body } as unknown as VercelRequest;
}

const AUTH = { authorization: 'Bearer t' };

beforeEach(() => {
  verifyTokenMock.mockReset();
  sqlMock.mockReset();
  __resetConstellationCacheForTests();
  __resetRateLimitForTests();
  process.env.CLERK_SECRET_KEY = 'test_secret';
  process.env.DATABASE_URL = 'postgres://test';
  verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
});

// Helper: prime the constellation cache for fam_1 by running one GET that hits SQL.
async function primeCache(): Promise<void> {
  sqlMock
    .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
    .mockResolvedValueOnce([
      {
        user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
        line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {},
        last_activity_at: null, status: 'sleeping',
      },
    ]);
  const r = mockRes();
  await constellationHandler(mockReq('GET', undefined, AUTH), r);
  expect(r.statusCode).toBe(200);
}

describe('Chaos M6: family cache invalidation', () => {
  it('invalidateFamilyCache() removes the cached payload so the next GET re-queries', async () => {
    await primeCache();
    // Without invalidation a second GET within 30s serves from cache (one SQL call only).
    sqlMock.mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }]);
    const cached = mockRes();
    await constellationHandler(mockReq('GET', undefined, AUTH), cached);
    expect(cached.statusCode).toBe(200);
    const callsBefore = sqlMock.mock.calls.length;

    // Now invalidate and verify the next GET re-runs the heavy member query.
    invalidateFamilyCache('fam_1');
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {},
          last_activity_at: null, status: 'sleeping',
        },
      ]);
    const fresh = mockRes();
    await constellationHandler(mockReq('GET', undefined, AUTH), fresh);
    expect(fresh.statusCode).toBe(200);
    // Two extra calls = family-lookup + member-query (cache miss).
    expect(sqlMock.mock.calls.length).toBe(callsBefore + 2);
  });

  it('successful join invalidates the cache for the joined family', async () => {
    await primeCache();
    const callsBefore = sqlMock.mock.calls.length;

    // join: findFamilyForUser empty, family lookup hit, BEGIN, SELECT FOR UPDATE,
    // COUNT, INSERT, COMMIT, fetchFamilyMembers.
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'creator' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'fam_1' }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ user_id: 'user_1', display_name: 'Ada', joined_at: 'x' }]);
    const r = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'XYZ123' }, AUTH), r);
    expect(r.statusCode).toBe(200);

    // Now a fresh constellation GET must re-query (cache evicted on join).
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {},
          last_activity_at: null, status: 'sleeping',
        },
      ]);
    const refresh = mockRes();
    await constellationHandler(mockReq('GET', undefined, AUTH), refresh);
    expect(refresh.statusCode).toBe(200);
    expect(sqlMock.mock.calls.length).toBeGreaterThan(callsBefore + 8);
  });

  it('rotate-code invalidates the cache', async () => {
    await primeCache();
    const callsBefore = sqlMock.mock.calls.length;

    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
      .mockResolvedValueOnce([{ invite_code: 'NEW123' }]);
    const r = mockRes();
    await rotateHandler(mockReq('POST', undefined, AUTH), r);
    expect(r.statusCode).toBe(200);

    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'NEW123', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {},
          last_activity_at: null, status: 'sleeping',
        },
      ]);
    const refresh = mockRes();
    await constellationHandler(mockReq('GET', undefined, AUTH), refresh);
    expect(refresh.statusCode).toBe(200);
    // Both the rotate call (2 SQL) and the refresh re-query (2 SQL) ran.
    expect(sqlMock.mock.calls.length).toBe(callsBefore + 4);
  });

  it('leave invalidates the cache', async () => {
    await primeCache();
    const callsBefore = sqlMock.mock.calls.length;

    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'someone_else' }])
      .mockResolvedValueOnce([])                 // BEGIN
      .mockResolvedValueOnce([])                 // DELETE
      .mockResolvedValueOnce([{ count: 1 }])     // remaining
      .mockResolvedValueOnce([]);                // COMMIT
    const r = mockRes();
    await membershipHandler(mockReq('DELETE', undefined, AUTH), r);
    expect(r.statusCode).toBe(204);

    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'someone_else' }])
      .mockResolvedValueOnce([
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {},
          last_activity_at: null, status: 'sleeping',
        },
      ]);
    const refresh = mockRes();
    await constellationHandler(mockReq('GET', undefined, AUTH), refresh);
    expect(refresh.statusCode).toBe(200);
    expect(sqlMock.mock.calls.length).toBe(callsBefore + 7);
  });
});
