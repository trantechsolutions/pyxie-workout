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
import handler, { sanitizeDisplayName } from '../../api/me';

const verifyTokenMock = verifyToken as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res as unknown as VercelResponse & { statusCode: number; body: unknown };
}

function mockReq(headers: Record<string, string> = {}): VercelRequest {
  return { headers } as unknown as VercelRequest;
}

describe('GET /api/me', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
    sqlMock.mockReset();
    process.env.CLERK_SECRET_KEY = 'test_secret';
    process.env.DATABASE_URL = 'postgres://test';
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(401);
    expect((res.body as { error: string }).error).toMatch(/bearer/i);
  });

  it('returns 401 when token verification fails', async () => {
    verifyTokenMock.mockRejectedValueOnce(new Error('bad sig'));
    const res = mockRes();
    await handler(mockReq({ authorization: 'Bearer junk' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('upserts and returns the user row on a valid token', async () => {
    verifyTokenMock.mockResolvedValueOnce({ sub: 'user_abc', email: 'ada@example.com' });
    const row = {
      id: 'user_abc',
      display_name: 'ada',
      created_at: '2026-05-23T00:00:00.000Z',
      updated_at: '2026-05-23T00:00:00.000Z',
    };
    sqlMock.mockResolvedValueOnce([row]);

    const res = mockRes();
    await handler(mockReq({ authorization: 'Bearer good' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(row);
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it('sanitizes long, control-char, bidi, and zero-width input (Chaos M2)', () => {
    // 40 chars -> capped to 32.
    const long = 'a'.repeat(40);
    expect(sanitizeDisplayName(long)).toHaveLength(32);

    // Plain whitespace trimming.
    expect(sanitizeDisplayName('  hi  ')).toBe('hi');

    // C0 control bell (U+0007).
    expect(sanitizeDisplayName('a' + String.fromCharCode(0x07) + 'b')).toBe('ab');

    // C1 control NEL (U+0085).
    expect(sanitizeDisplayName('x' + String.fromCharCode(0x85) + 'y')).toBe('xy');

    // Zero-width joiner (U+200D).
    expect(sanitizeDisplayName('a' + String.fromCharCode(0x200D) + 'b')).toBe('ab');

    // Bidi override RLO (U+202E).
    expect(sanitizeDisplayName('good' + String.fromCharCode(0x202E) + 'evil')).toBe('goodevil');

    // Bidi isolate LRI (U+2066).
    expect(sanitizeDisplayName('p' + String.fromCharCode(0x2066) + 'q')).toBe('pq');
  });

  it('falls back to "Friend" when no email is on the token', async () => {
    verifyTokenMock.mockResolvedValueOnce({ sub: 'user_xyz' });
    let capturedParams: unknown[] = [];
    sqlMock.mockImplementationOnce((_strings: TemplateStringsArray, ...params: unknown[]) => {
      capturedParams = params;
      return Promise.resolve([{
        id: 'user_xyz',
        display_name: 'Friend',
        created_at: 'x',
        updated_at: 'x',
      }]);
    });

    const res = mockRes();
    await handler(mockReq({ authorization: 'Bearer good' }), res);

    expect(res.statusCode).toBe(200);
    expect(capturedParams).toContain('user_xyz');
    expect(capturedParams).toContain('Friend');
  });
});
