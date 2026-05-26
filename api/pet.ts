import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from './_lib/auth.js';
import { getSql } from './_lib/db.js';

// ADR-009 M1: full canonical pet stored as JSONB. 8 KiB cap is generous —
// current Pet serializes to <1 KiB; anything beyond is junk or abuse.
const MAX_PET_STATE_BYTES = 8 * 1024;

interface PetRow {
  state: Record<string, unknown>;
  version: number;
  updated_at: string;
}

interface ValidatedBody {
  state: Record<string, unknown>;
  version?: number;
}

function validatePutBody(body: unknown): ValidatedBody | string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'invalid_body';
  const b = body as Record<string, unknown>;
  const state = b.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return 'invalid_body';
  const serialized = JSON.stringify(state);
  if (serialized.length > MAX_PET_STATE_BYTES) return 'pet_too_large';
  let version: number | undefined;
  if (b.version !== undefined) {
    if (typeof b.version !== 'number' || !Number.isInteger(b.version) || b.version < 1) {
      return 'invalid_body';
    }
    version = b.version;
  }
  return { state: state as Record<string, unknown>, version };
}

async function handleGet(userId: string, res: VercelResponse) {
  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT state, version, updated_at
      FROM pets
      WHERE user_id = ${userId}
    `) as unknown as PetRow[];
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'pet_not_found' });
    }
    return res.status(200).json({
      state: row.state,
      version: row.version,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[pet] GET db error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

async function handlePut(userId: string, req: VercelRequest, res: VercelResponse) {
  const validated = validatePutBody(req.body);
  if (typeof validated === 'string') {
    const status = validated === 'pet_too_large' ? 413 : 400;
    return res.status(status).json({ error: validated });
  }

  try {
    const sql = getSql();
    const stateJson = JSON.stringify(validated.state);
    const versionParam = validated.version ?? null;
    const rows = (await sql`
      INSERT INTO pets (user_id, state, version, updated_at)
      VALUES (
        ${userId},
        ${stateJson}::jsonb,
        COALESCE(${versionParam}::integer, 1),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        state = EXCLUDED.state,
        version = COALESCE(${versionParam}::integer, pets.version + 1),
        updated_at = NOW()
      RETURNING state, version, updated_at
    `) as unknown as PetRow[];
    const row = rows[0];
    if (!row) {
      // eslint-disable-next-line no-console
      console.error('[pet] PUT upsert returned no row');
      return res.status(500).json({ error: 'internal_error' });
    }
    return res.status(200).json({
      state: row.state,
      version: row.version,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[pet] PUT db error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

async function handleDelete(userId: string, res: VercelResponse) {
  try {
    const sql = getSql();
    await sql`DELETE FROM pets WHERE user_id = ${userId}`;
    res.status(204);
    return res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[pet] DELETE db error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method ?? 'GET';
  if (method !== 'GET' && method !== 'PUT' && method !== 'DELETE') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Auth verification failed' });
  }

  if (method === 'GET') return handleGet(user.userId, res);
  if (method === 'PUT') return handlePut(user.userId, req, res);
  return handleDelete(user.userId, res);
}
