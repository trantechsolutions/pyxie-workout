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
import handler from '../../api/pet-snapshot';

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

function mockReq(body: unknown, headers: Record<string, string> = {}, method = 'PUT'): VercelRequest {
  return { method, headers, body } as unknown as VercelRequest;
}

const VALID_BODY = {
  line: 'ember',
  stage: 2,
  lineage_id: 'ember-warrior',
  sprite_state: { palette: 'warm' },
};

describe('PUT /api/pet-snapshot', () => {
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
    await handler(mockReq({ line: 'ember' }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an unknown line (Chaos M1)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const res = mockRes();
    await handler(mockReq({ ...VALID_BODY, line: 'mystery' }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
    expect((res.body as { error: string }).error).toMatch(/line/i);
  });

  it('rejects a sprite_state JSON over 4096 bytes (Chaos M1)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const huge = { blob: 'x'.repeat(5000) };
    const res = mockRes();
    await handler(mockReq({ ...VALID_BODY, sprite_state: huge }, { authorization: 'Bearer t' }), res);
    expect(res.statusCode).toBe(400);
    expect((res.body as { error: string }).error).toBe('sprite_state_too_large');
  });

  it('rejects a lineage_id over 64 chars (Chaos M1)', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_1' });
    const res = mockRes();
    await handler(
      mockReq({ ...VALID_BODY, lineage_id: 'l'.repeat(65) }, { authorization: 'Bearer t' }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('KNOWN_LINES parity: every line in lineRegistry is accepted server-side', async () => {
    // The server's KNOWN_LINES must list every key in LINE_REGISTRY (Chaos M1).
    const { KNOWN_LINES } = await import('../../api/_lib/lines');
    const { LINE_REGISTRY } = await import('../../src/data/lineRegistry');
    for (const line of Object.keys(LINE_REGISTRY)) {
      expect(KNOWN_LINES.has(line)).toBe(true);
    }
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
});
