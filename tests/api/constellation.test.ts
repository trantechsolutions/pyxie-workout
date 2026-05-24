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
import constellationHandler, { __resetConstellationCacheForTests } from '../../api/family/constellation';

const verifyTokenMock = verifyToken as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
    end() { return this; },
  };
  return res as unknown as VercelResponse & { statusCode: number; body: unknown };
}

function mockReq(method: string, headers: Record<string, string> = {}): VercelRequest {
  return { method, headers } as unknown as VercelRequest;
}

const AUTH = { authorization: 'Bearer t' };

beforeEach(() => {
  verifyTokenMock.mockReset();
  sqlMock.mockReset();
  __resetConstellationCacheForTests();
  process.env.CLERK_SECRET_KEY = 'test_secret';
  process.env.DATABASE_URL = 'postgres://test';
  verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
});

describe('GET /api/family/constellation', () => {
  it('returns 401 without an auth header', async () => {
    const res = mockRes();
    await constellationHandler(mockReq('GET'), res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 405 for non-GET', async () => {
    const res = mockRes();
    await constellationHandler(mockReq('POST', AUTH), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 404 no_family when caller is not in a family', async () => {
    sqlMock.mockResolvedValueOnce([]); // findFamilyForUser
    const res = mockRes();
    await constellationHandler(mockReq('GET', AUTH), res);
    expect(res.statusCode).toBe(404);
    expect((res.body as { error: string }).error).toBe('no_family');
  });

  it('returns members across three status buckets with caller first', async () => {
    const nowMs = Date.now();
    const within24h = new Date(nowMs - 2 * 60 * 60 * 1000).toISOString();
    const within3d = new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString();
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        // SQL would already pre-order by joined_at; we feed the same shape.
        // status field is overridden server-side by deriveConstellationStatus
        // (defense-in-depth, qa-engineer follow-up).
        {
          user_id: 'user_2', display_name: 'Lin', joined_at: 'b',
          line: 'tide', stage: 1, lineage_id: 'tide', sprite_state: {},
          last_activity_at: null, status: 'sleeping',
        },
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: 'ember', stage: 2, lineage_id: 'ember', sprite_state: { seed: 42 },
          last_activity_at: within24h, status: 'active',
        },
        {
          user_id: 'user_3', display_name: 'Pat', joined_at: 'c',
          line: 'verdant', stage: 0, lineage_id: 'verdant', sprite_state: {},
          last_activity_at: within3d, status: 'drifting',
        },
      ]);
    const res = mockRes();
    await constellationHandler(mockReq('GET', AUTH), res);
    expect(res.statusCode).toBe(200);
    const body = res.body as {
      family: { id: string; name: string; invite_code: string };
      members: Array<{ user_id: string; status: string; sprite: unknown }>;
    };
    expect(body.family.id).toBe('fam_1');
    expect(body.members).toHaveLength(3);
    // Caller (user_1) must be first.
    expect(body.members[0].user_id).toBe('user_1');
    // Sprite null fallback would be member-3 if line were absent; ensure
    // sprite is populated when present.
    expect(body.members[0].sprite).not.toBeNull();
    // Status buckets are preserved verbatim.
    const statuses = body.members.map((m) => m.status).sort();
    expect(statuses).toEqual(['active', 'drifting', 'sleeping']);
  });

  it('returns null sprite when the member has no pet_snapshots row', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: null, stage: null, lineage_id: null, sprite_state: null,
          last_activity_at: null, status: 'sleeping',
        },
      ]);
    const res = mockRes();
    await constellationHandler(mockReq('GET', AUTH), res);
    expect(res.statusCode).toBe(200);
    const body = res.body as { members: Array<{ sprite: unknown }> };
    expect(body.members[0].sprite).toBeNull();
  });

  it('serves a cached response on the second call within 30s', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        {
          user_id: 'user_1', display_name: 'Ada', joined_at: 'a',
          line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {},
          last_activity_at: null, status: 'sleeping',
        },
      ])
      // Second call: findFamilyForUser still runs (auth+lookup are cheap),
      // but the heavy member query should not.
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'user_1' }]);
    const r1 = mockRes();
    await constellationHandler(mockReq('GET', AUTH), r1);
    expect(r1.statusCode).toBe(200);
    const r2 = mockRes();
    await constellationHandler(mockReq('GET', AUTH), r2);
    expect(r2.statusCode).toBe(200);
    // Three sql calls in total: family lookup x2 + member query x1.
    expect(sqlMock).toHaveBeenCalledTimes(3);
  });
});
