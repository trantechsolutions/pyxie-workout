import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from './_lib/auth.js';
import { getSql } from './_lib/db.js';
import { KNOWN_LINES } from './_lib/lines.js';

interface IncomingSnapshot {
  line: string;
  stage: number;
  lineage_id: string;
  sprite_state: Record<string, unknown>;
}

// Chaos M1: hard caps on snapshot payload. A 4KB JSON blob is wildly more
// than the renderer needs (~few hundred bytes); anything beyond is junk or
// abuse. Line must be a known registry key; lineage_id is short string.
const MAX_SPRITE_STATE_BYTES = 4096;
const MAX_LINE_CHARS = 64;
const MAX_LINEAGE_CHARS = 64;

function validate(body: unknown): IncomingSnapshot | string {
  if (!body || typeof body !== 'object') return 'Malformed body';
  const b = body as Record<string, unknown>;
  if (typeof b.line !== 'string' || b.line.length === 0) return 'Invalid line';
  if (b.line.length > MAX_LINE_CHARS) return 'Invalid line';
  if (!KNOWN_LINES.has(b.line)) return 'Invalid line';
  if (typeof b.stage !== 'number' || !Number.isInteger(b.stage) || b.stage < 0) return 'Invalid stage';
  if (typeof b.lineage_id !== 'string') return 'Invalid lineage_id';
  if (b.lineage_id.length > MAX_LINEAGE_CHARS) return 'Invalid lineage_id';
  if (!b.sprite_state || typeof b.sprite_state !== 'object' || Array.isArray(b.sprite_state)) {
    return 'Invalid sprite_state';
  }
  const serialized = JSON.stringify(b.sprite_state);
  if (serialized.length > MAX_SPRITE_STATE_BYTES) return 'sprite_state_too_large';
  return {
    line: b.line,
    stage: b.stage,
    lineage_id: b.lineage_id,
    sprite_state: b.sprite_state as Record<string, unknown>,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Auth verification failed' });
  }

  const validated = validate(req.body);
  if (typeof validated === 'string') {
    return res.status(400).json({ error: validated });
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO pet_snapshots (user_id, line, stage, lineage_id, sprite_state, updated_at)
      VALUES (
        ${user.userId},
        ${validated.line},
        ${validated.stage},
        ${validated.lineage_id},
        ${JSON.stringify(validated.sprite_state)}::jsonb,
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        line = EXCLUDED.line,
        stage = EXCLUDED.stage,
        lineage_id = EXCLUDED.lineage_id,
        sprite_state = EXCLUDED.sprite_state,
        updated_at = NOW()
    `;
    res.status(204);
    return res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[pet-snapshot] db error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
