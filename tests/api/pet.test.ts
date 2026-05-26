import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mocks must be declared before importing the handler under test.
vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

const sqlMock = vi.fn();
vi.mock('../../api/_lib/db', () => ({
  getSql: () => sqlMock,
}));

import { verifyToken } from '@clerk/backend';
import handler from '../../api/pet';

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

function mockReq(
  body: unknown,
  headers: Record<string, string> = {},
  method = 'GET',
): VercelRequest {
  return { method, headers, body } as unknown as VercelRequest;
}

// `requireUser` (api/_lib/auth.ts) issues an `INSERT INTO users ... ON CONFLICT
// DO NOTHING` on every authenticated request, which consumes one sqlMock call
// before the handler's own DB work. Authed tests must mock both calls.
function mockEnsureUserCall() {
  sqlMock.mockResolvedValueOnce([]);
}

const VALID_STATE = { name: 'Sparky', hunger: 80, happiness: 70, alive: true };

describe('/api/pet', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
    sqlMock.mockReset();
    process.env.CLERK_SECRET_KEY = 'test_secret';
    process.env.DATABASE_URL = 'postgres://test';
  });

  // ---------- method routing ----------

  it('returns 405 for unsupported methods (POST)', async () => {
    const res = mockRes();
    await handler(mockReq(undefined, {}, 'POST'), res);
    expect(res.statusCode).toBe(405);
    expect((res.body as { error: string }).error).toBe('method_not_allowed');
  });

  it('returns 405 for unsupported methods (PATCH)', async () => {
    const res = mockRes();
    await handler(mockReq(undefined, {}, 'PATCH'), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 405 for unsupported methods (OPTIONS)', async () => {
    const res = mockRes();
    await handler(mockReq(undefined, {}, 'OPTIONS'), res);
    expect(res.statusCode).toBe(405);
  });

  // ---------- GET ----------

  it('GET returns 401 unauthenticated', async () => {
    const res = mockRes();
    await handler(mockReq(undefined, {}, 'GET'), res);
    expect(res.statusCode).toBe(401);
  });

  it('GET returns 404 when no row exists', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    sqlMock.mockResolvedValueOnce([]); // empty SELECT
    const res = mockRes();
    await handler(mockReq(undefined, { authorization: 'Bearer t' }, 'GET'), res);
    expect(res.statusCode).toBe(404);
    expect((res.body as { error: string }).error).toBe('pet_not_found');
  });

  it('GET returns 200 with state/version/updatedAt when row exists', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    sqlMock.mockResolvedValueOnce([{
      state: VALID_STATE,
      version: 3,
      updated_at: '2026-05-26T10:00:00.000Z',
    }]);
    const res = mockRes();
    await handler(mockReq(undefined, { authorization: 'Bearer t' }, 'GET'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      state: VALID_STATE,
      version: 3,
      updatedAt: '2026-05-26T10:00:00.000Z',
    });
  });

  // ---------- PUT ----------

  it('PUT returns 401 unauthenticated', async () => {
    const res = mockRes();
    await handler(mockReq({ state: VALID_STATE }, {}, 'PUT'), res);
    expect(res.statusCode).toBe(401);
  });

  it('PUT returns 400 on malformed JSON (body is null)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const res = mockRes();
    await handler(mockReq(null, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_body');
  });

  it('PUT returns 400 when state is missing', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const res = mockRes();
    await handler(mockReq({ version: 1 }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(400);
  });

  it('PUT returns 400 when state is an array', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const res = mockRes();
    await handler(mockReq({ state: [1, 2, 3] }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(400);
  });

  it('PUT returns 400 when state is null', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const res = mockRes();
    await handler(mockReq({ state: null }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(400);
  });

  it('PUT returns 400 when state is a string', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const res = mockRes();
    await handler(mockReq({ state: 'oops' }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(400);
  });

  it('PUT returns 413 when serialized body > 8 KiB', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const huge = { blob: 'x'.repeat(9000) };
    const res = mockRes();
    await handler(mockReq({ state: huge }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(413);
    expect((res.body as { error: string }).error).toBe('pet_too_large');
  });

  it('PUT first time (no existing row) returns 200 with created row', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    sqlMock.mockResolvedValueOnce([{
      state: VALID_STATE,
      version: 1,
      updated_at: '2026-05-26T10:00:00.000Z',
    }]);
    const res = mockRes();
    await handler(mockReq({ state: VALID_STATE }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      state: VALID_STATE,
      version: 1,
      updatedAt: '2026-05-26T10:00:00.000Z',
    });
  });

  it('PUT second time (no explicit version) returns 200 with incremented version', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    // Simulate the ON CONFLICT path: server-side COALESCE bumps version.
    sqlMock.mockResolvedValueOnce([{
      state: VALID_STATE,
      version: 2,
      updated_at: '2026-05-26T10:01:00.000Z',
    }]);
    const res = mockRes();
    await handler(mockReq({ state: VALID_STATE }, { authorization: 'Bearer t' }, 'PUT'), res);
    expect(res.statusCode).toBe(200);
    expect((res.body as { version: number }).version).toBe(2);
  });

  it('PUT with explicit version: 5 returns 200 with version exactly 5', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    let capturedParams: unknown[] = [];
    sqlMock.mockImplementationOnce((_strings: TemplateStringsArray, ...params: unknown[]) => {
      capturedParams = params;
      return Promise.resolve([{
        state: VALID_STATE,
        version: 5,
        updated_at: '2026-05-26T10:02:00.000Z',
      }]);
    });
    const res = mockRes();
    await handler(
      mockReq({ state: VALID_STATE, version: 5 }, { authorization: 'Bearer t' }, 'PUT'),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect((res.body as { version: number }).version).toBe(5);
    // Confirm the client-supplied version was sent to SQL (not null).
    expect(capturedParams).toContain(5);
  });

  it('PUT rejects invalid version (zero)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    const res = mockRes();
    await handler(
      mockReq({ state: VALID_STATE, version: 0 }, { authorization: 'Bearer t' }, 'PUT'),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  // ---------- DELETE ----------

  it('DELETE returns 401 unauthenticated', async () => {
    const res = mockRes();
    await handler(mockReq(undefined, {}, 'DELETE'), res);
    expect(res.statusCode).toBe(401);
  });

  it('DELETE returns 204 when no row exists (idempotent)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    sqlMock.mockResolvedValueOnce([]); // DELETE with no rows
    const res = mockRes();
    await handler(mockReq(undefined, { authorization: 'Bearer t' }, 'DELETE'), res);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
  });

  it('DELETE returns 204 when row exists and issues DELETE SQL', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    mockEnsureUserCall();
    sqlMock.mockResolvedValueOnce([{ user_id: 'user_1' }]);
    const res = mockRes();
    await handler(mockReq(undefined, { authorization: 'Bearer t' }, 'DELETE'), res);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
    // ensureUserRow + DELETE
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });
});
