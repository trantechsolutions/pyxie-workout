import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from './_lib/auth.js';
import { getSql } from './_lib/db.js';

const VALID_INTENSITY = new Set(['easy', 'medium', 'hard']);
const VALID_COMPLEXITY = new Set(['beginner', 'intermediate', 'advanced']);
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// ADR-0007 / chaos H1: small forward-tolerance window for clock skew between
// client and server. Anything beyond this is rejected as a future-dated event.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
// RFC 4122: 8-4-4-4-12 hex.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface IncomingEvent {
  id: string;
  completed_at: string;
  intensity: string;
  complexity: string;
  xp_gained: number;
}

function validate(body: unknown): IncomingEvent | string {
  if (!body || typeof body !== 'object') return 'Malformed body';
  const b = body as Record<string, unknown>;

  if (typeof b.id !== 'string' || !UUID_RE.test(b.id)) return 'Invalid id';
  if (typeof b.completed_at !== 'string') return 'Invalid completed_at';
  const ms = Date.parse(b.completed_at);
  if (Number.isNaN(ms)) return 'Invalid completed_at';
  if (Date.now() - ms > MAX_AGE_MS) return 'Event too old';
  if (ms - Date.now() > FUTURE_TOLERANCE_MS) return 'event_in_future';
  if (typeof b.intensity !== 'string' || !VALID_INTENSITY.has(b.intensity)) return 'Invalid intensity';
  if (typeof b.complexity !== 'string' || !VALID_COMPLEXITY.has(b.complexity)) return 'Invalid complexity';
  if (typeof b.xp_gained !== 'number' || !Number.isFinite(b.xp_gained) || b.xp_gained < 0) {
    return 'Invalid xp_gained';
  }

  return {
    id: b.id,
    completed_at: new Date(ms).toISOString(),
    intensity: b.intensity,
    complexity: b.complexity,
    xp_gained: Math.floor(b.xp_gained),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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
      INSERT INTO workout_events (id, user_id, completed_at, intensity, complexity, xp_gained)
      VALUES (
        ${validated.id},
        ${user.userId},
        ${validated.completed_at},
        ${validated.intensity},
        ${validated.complexity},
        ${validated.xp_gained}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    res.status(204);
    return res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[workout-events] db error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
