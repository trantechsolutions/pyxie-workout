import { verifyToken } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';
import { getSql } from './db.js';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

export interface AuthedUser {
  userId: string;
  email?: string;
}

function extractBearer(header: string | string[] | undefined): string | null {
  if (!header) return null;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const [scheme, token] = value.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Verifies the Clerk session token attached to the request.
 * Throws AuthError(401) when missing or invalid.
 *
 * CLERK_SECRET_KEY must be available at request time.
 */
export async function requireUser(req: VercelRequest): Promise<AuthedUser> {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    throw new AuthError('Missing bearer token');
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new AuthError('Auth not configured', 500);
  }

  interface ClerkJwtPayload {
    sub?: string;
    email?: string;
  }

  let payload: ClerkJwtPayload;
  try {
    payload = (await verifyToken(token, { secretKey })) as ClerkJwtPayload;
  } catch {
    throw new AuthError('Invalid session token');
  }

  const userId = payload.sub;
  if (!userId) {
    throw new AuthError('Invalid session token');
  }

  // Guarantee a users row exists before any handler references it via FK.
  // INSERT ... ON CONFLICT DO NOTHING is a no-op on re-entry, so this is
  // safe to run on every authenticated request. /api/me still handles the
  // richer display_name derivation when the client explicitly hits it.
  try {
    const sql = getSql();
    const fallback = payload.email?.split('@')[0]?.slice(0, 32) || 'Friend';
    await sql`
      INSERT INTO users (id, display_name)
      VALUES (${userId}, ${fallback})
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (err) {
    // Don't fail the request on a transient users-row insert — the handler
    // will hit its own FK violation if the row truly cannot be created,
    // which is the right place to surface the error.
    // eslint-disable-next-line no-console
    console.warn('[auth] ensureUserRow failed', err);
  }

  return { userId, email: payload.email };
}
