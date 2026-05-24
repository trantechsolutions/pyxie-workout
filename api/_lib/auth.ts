import { verifyToken } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

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

  return { userId, email: payload.email };
}
