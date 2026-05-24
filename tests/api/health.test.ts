import { describe, it, expect, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/health';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res as unknown as VercelResponse & { statusCode: number; body: unknown };
}

describe('GET /api/health', () => {
  it('returns 200 with ok=true and an ISO timestamp', async () => {
    const req = {} as VercelRequest;
    const res = mockRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const body = res.body as { ok: boolean; timestamp: string };
    expect(body.ok).toBe(true);
    expect(typeof body.timestamp).toBe('string');
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });

  it('does not depend on env vars', async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const res = mockRes();
    await handler({} as VercelRequest, res);
    expect(res.statusCode).toBe(200);
    if (prev !== undefined) process.env.DATABASE_URL = prev;
    vi.restoreAllMocks();
  });
});
