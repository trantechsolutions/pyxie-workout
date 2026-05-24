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
import handler from '../../api/workout-events';

const verifyTokenMock = verifyToken as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    ended: false,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
    end() { this.ended = true; return this; },
  };
  return res as unknown as VercelResponse & { statusCode: number; body: unknown; ended: boolean };
}

function mockReq(body: unknown, headers: Record<string, string> = {}, method = 'POST'): VercelRequest {
  return { method, headers, body } as unknown as VercelRequest;
}

const VALID_BODY = {
  id: '11111111-2222-3333-4444-555555555555',
  completed_at: new Date().toISOString(),
  intensity: 'medium',
  complexity: 'beginner',
  xp_gained: 22,
};

describe('POST /api/workout-events', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
    sqlMock.mockReset();
    process.env.CLERK_SECRET_KEY = 'test_secret';
    process.env.DATABASE_URL = 'postgres://test';
  });

  it('returns 401 unauthenticated', async () => {
    const res = mockRes();
    await handler(mockReq(VALID_BODY), res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 on malformed body', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const res = mockRes();
    await handler(mockReq({ foo: 'bar' }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 on event older than 30 days', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const res = mockRes();
    await handler(mockReq({ ...VALID_BODY, completed_at: old }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 on invalid intensity', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const res = mockRes();
    await handler(mockReq({ ...VALID_BODY, intensity: 'crushing' }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 204 on happy path', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    sqlMock.mockResolvedValueOnce([]);
    const res = mockRes();
    await handler(mockReq(VALID_BODY, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it('accepts events exactly at the +5min future tolerance boundary', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    sqlMock.mockResolvedValueOnce([]);
    const futureAtBoundary = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const res = mockRes();
    await handler(mockReq({ ...VALID_BODY, completed_at: futureAtBoundary }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(204);
  });

  it('rejects events 1s past the +5min future tolerance with event_in_future', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const tooFar = new Date(Date.now() + 5 * 60 * 1000 + 1_500).toISOString();
    const res = mockRes();
    await handler(mockReq({ ...VALID_BODY, completed_at: tooFar }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
    expect((res.body as { error: string }).error).toBe('event_in_future');
  });

  it('returns 204 on duplicate (idempotency)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    // ON CONFLICT DO NOTHING just returns no rows; handler still 204s.
    sqlMock.mockResolvedValue([]);
    const res1 = mockRes();
    await handler(mockReq(VALID_BODY, { authorization: 'Bearer t' }), res1);
    const res2 = mockRes();
    await handler(mockReq(VALID_BODY, { authorization: 'Bearer t' }), res2);
    expect(res1.statusCode).toBe(204);
    expect(res2.statusCode).toBe(204);
  });
});
