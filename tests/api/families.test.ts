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
import createHandler from '../../api/families/index';
import mineHandler from '../../api/families/mine';
import joinHandler from '../../api/families/join';
import membershipHandler from '../../api/families/membership';
import rotateHandler from '../../api/families/rotate-code';
import { __resetRateLimitForTests } from '../../api/_lib/rateLimit';
import { __resetConstellationCacheForTests } from '../../api/family/constellation';

const verifyTokenMock = verifyToken as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    ended: false,
    headers: {} as Record<string, string>,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
    end() { this.ended = true; return this; },
    setHeader(name: string, value: string) { this.headers[name] = value; return this; },
  };
  return res as unknown as VercelResponse & {
    statusCode: number; body: unknown; ended: boolean; headers: Record<string, string>;
  };
}

function mockReq(method: string, body?: unknown, headers: Record<string, string> = {}): VercelRequest {
  return { method, headers, body } as unknown as VercelRequest;
}

const AUTH = { authorization: 'Bearer t' };

beforeEach(() => {
  verifyTokenMock.mockReset();
  sqlMock.mockReset();
  __resetRateLimitForTests();
  __resetConstellationCacheForTests();
  process.env.CLERK_SECRET_KEY = 'test_secret';
  process.env.DATABASE_URL = 'postgres://test';
  verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
});

describe('POST /api/families (create)', () => {
  it('creates a new family for a user not in one', async () => {
    sqlMock
      // findFamilyForUser -> none
      .mockResolvedValueOnce([])
      // insert into families
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'Trans', invite_code: 'ABCDEF', created_by: 'user_1' }])
      // insert into family_members
      .mockResolvedValueOnce([])
      // fetchFamilyMembers
      .mockResolvedValueOnce([{ user_id: 'user_1', display_name: 'Ada', joined_at: 'x' }]);
    const res = mockRes();
    await createHandler(mockReq('POST', { name: 'Trans' }, AUTH), res);
    expect(res.statusCode).toBe(201);
    const body = res.body as { invite_code: string; members: unknown[] };
    expect(body.invite_code).toBe('ABCDEF');
    expect(body.members).toHaveLength(1);
  });

  it('returns 409 when user already in a family', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 'fam_x', name: 'Old', invite_code: 'AAAAAA', created_by: 'user_1' }]);
    const res = mockRes();
    await createHandler(mockReq('POST', { name: 'New' }, AUTH), res);
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/families/join', () => {
  // Chaos M4: join wraps cap-check + insert in BEGIN/SELECT FOR UPDATE/COMMIT.
  // Test mocks therefore include the transaction control statements.
  it('joins on happy path', async () => {
    sqlMock
      .mockResolvedValueOnce([])                                   // findFamilyForUser
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'creator' }])
      .mockResolvedValueOnce([])                                   // BEGIN
      .mockResolvedValueOnce([{ id: 'fam_1' }])                    // SELECT FOR UPDATE
      .mockResolvedValueOnce([{ count: 2 }])                       // member count
      .mockResolvedValueOnce([])                                   // insert
      .mockResolvedValueOnce([])                                   // COMMIT
      .mockResolvedValueOnce([{ user_id: 'user_1', display_name: 'A', joined_at: 'x' }]); // members
    const res = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'xyz123' }, AUTH), res);
    expect(res.statusCode).toBe(200);
    // M7: created_by is now exposed on the payload.
    expect((res.body as { created_by: string }).created_by).toBe('creator');
  });

  it('returns 404 unknown code', async () => {
    sqlMock
      .mockResolvedValueOnce([]) // findFamilyForUser
      .mockResolvedValueOnce([]); // family lookup returns nothing
    const res = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'NOPE12' }, AUTH), res);
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when family is full', async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'creator' }])
      .mockResolvedValueOnce([])                                   // BEGIN
      .mockResolvedValueOnce([{ id: 'fam_1' }])                    // SELECT FOR UPDATE
      .mockResolvedValueOnce([{ count: 8 }])                       // member count
      .mockResolvedValueOnce([]);                                  // COMMIT
    const res = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'XYZ123' }, AUTH), res);
    expect(res.statusCode).toBe(409);
    expect((res.body as { error: string }).error).toBe('family_full');
  });

  it('returns 409 when already in a family', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 'fam_x', name: 'O', invite_code: 'AAA111', created_by: 'creator' }]);
    const res = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'XYZ123' }, AUTH), res);
    expect(res.statusCode).toBe(409);
  });

  it('rate-limits the 11th join attempt within 10min and returns 429 with retryAfterMs (Chaos H2)', async () => {
    // First 10 attempts: each does findFamily(empty) + lookup(empty -> 404).
    for (let i = 0; i < 10; i += 1) {
      sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      const res = mockRes();
      await joinHandler(mockReq('POST', { invite_code: 'ZZZZZZ' }, AUTH), res);
      expect(res.statusCode).toBe(404);
    }
    // 11th: rate-limit short-circuits before any sql is touched.
    const blocked = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'ZZZZZZ' }, AUTH), blocked);
    expect(blocked.statusCode).toBe(429);
    const body = blocked.body as { error: string; retryAfterMs: number };
    expect(body.error).toBe('rate_limited');
    expect(body.retryAfterMs).toBeGreaterThan(0);
  });

  it('wraps cap-check + insert in a transaction (Chaos M4)', async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'creator' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'fam_1' }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ user_id: 'user_1', display_name: 'A', joined_at: 'x' }]);
    const res = mockRes();
    await joinHandler(mockReq('POST', { invite_code: 'XYZ123' }, AUTH), res);
    expect(res.statusCode).toBe(200);
    // BEGIN + SELECT FOR UPDATE + COUNT + INSERT + COMMIT all hit sqlMock.
    const calls = sqlMock.mock.calls.length;
    expect(calls).toBe(8);
  });
});

describe('GET /api/families/mine', () => {
  it('returns 404 when user has no family', async () => {
    sqlMock.mockResolvedValueOnce([]);
    const res = mockRes();
    await mineHandler(mockReq('GET', undefined, AUTH), res);
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with members', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'XYZ123', created_by: 'user_1' }])
      .mockResolvedValueOnce([
        { user_id: 'user_1', display_name: 'Ada', joined_at: 'a' },
        { user_id: 'user_2', display_name: 'Lin', joined_at: 'b' },
      ]);
    const res = mockRes();
    await mineHandler(mockReq('GET', undefined, AUTH), res);
    expect(res.statusCode).toBe(200);
    expect((res.body as { members: unknown[] }).members).toHaveLength(2);
  });
});

describe('DELETE /api/families/membership', () => {
  // Membership now wraps in BEGIN/COMMIT so it can transactionally hand off
  // ownership when the creator leaves (Chaos H3).
  it('returns 204 on leave (non-creator path)', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'creator' }])
      .mockResolvedValueOnce([])                 // BEGIN
      .mockResolvedValueOnce([])                 // DELETE member
      .mockResolvedValueOnce([{ count: 2 }])     // remaining count
      .mockResolvedValueOnce([]);                // COMMIT
    const res = mockRes();
    await membershipHandler(mockReq('DELETE', undefined, AUTH), res);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
  });

  it('cascades family delete when last member leaves', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
      .mockResolvedValueOnce([])                 // BEGIN
      .mockResolvedValueOnce([])                 // DELETE member
      .mockResolvedValueOnce([{ count: 0 }])     // remaining count = 0
      .mockResolvedValueOnce([])                 // DELETE families
      .mockResolvedValueOnce([]);                // COMMIT
    const res = mockRes();
    await membershipHandler(mockReq('DELETE', undefined, AUTH), res);
    expect(res.statusCode).toBe(204);
  });

  it('transfers ownership to the next-oldest member when creator leaves (Chaos H3)', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
      .mockResolvedValueOnce([])                 // BEGIN
      .mockResolvedValueOnce([])                 // DELETE member
      .mockResolvedValueOnce([{ count: 2 }])     // remaining count = 2
      .mockResolvedValueOnce([{ user_id: 'user_2' }]) // next-oldest member
      .mockResolvedValueOnce([])                 // UPDATE families SET created_by
      .mockResolvedValueOnce([]);                // COMMIT
    const res = mockRes();
    await membershipHandler(mockReq('DELETE', undefined, AUTH), res);
    expect(res.statusCode).toBe(204);
    // Sanity: the UPDATE call should mention user_2 in its params.
    const updateCall = sqlMock.mock.calls.find((c) => {
      const params = c.slice(1);
      return params.includes('user_2');
    });
    expect(updateCall).toBeTruthy();
  });
});

describe('POST /api/families/rotate-code', () => {
  it('returns 403 if not creator and family is not orphaned', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'someone_else' }]);
    const res = mockRes();
    await rotateHandler(mockReq('POST', undefined, AUTH), res);
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 and new code on happy path', async () => {
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: 'user_1' }])
      .mockResolvedValueOnce([{ invite_code: 'NEW123' }]);
    const res = mockRes();
    await rotateHandler(mockReq('POST', undefined, AUTH), res);
    expect(res.statusCode).toBe(200);
    expect((res.body as { invite_code: string }).invite_code).toBe('NEW123');
  });

  it('orphaned family: any remaining member may claim ownership + rotate (Chaos H3)', async () => {
    // created_by is null -> caller is a non-creator member but allowed.
    sqlMock
      .mockResolvedValueOnce([{ id: 'fam_1', name: 'F', invite_code: 'X', created_by: null }])
      .mockResolvedValueOnce([{ invite_code: 'CLAIM1' }]);
    const res = mockRes();
    await rotateHandler(mockReq('POST', undefined, AUTH), res);
    expect(res.statusCode).toBe(200);
    expect((res.body as { invite_code: string }).invite_code).toBe('CLAIM1');
    // The UPDATE statement carries user_1 as the claimant.
    const updateCall = sqlMock.mock.calls[1];
    expect(updateCall.slice(1)).toContain('user_1');
  });
});
