import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from './_lib/auth.js';
import { getSql } from './_lib/db.js';

interface UserRow {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

// Chaos M2: server-side normalization for display names. Strips C0/C1
// control chars and bidi overrides so a hostile email local-part cannot
// break layout or spoof another member's name in the constellation pane.
//
// Ranges removed:
//   U+0000..U+001F  C0 controls
//   U+007F..U+009F  DEL + C1 controls
//   U+200B..U+200F  ZWSP / ZWNJ / ZWJ / LRM / RLM
//   U+202A..U+202E  LRE / RLE / PDF / LRO / RLO
//   U+2066..U+2069  LRI / RLI / FSI / PDI
const CONTROL_AND_BIDI_RE = new RegExp(
  '[\\u0000-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069]',
  'g',
);
const DISPLAY_NAME_MAX = 32;

export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim();
  const normalized = (typeof trimmed.normalize === 'function' ? trimmed.normalize('NFC') : trimmed)
    .replace(CONTROL_AND_BIDI_RE, '');
  return normalized.slice(0, DISPLAY_NAME_MAX);
}

function deriveDisplayName(email: string | undefined): string {
  if (!email) return 'Friend';
  const local = email.split('@')[0];
  if (typeof local !== 'string') return 'Friend';
  const cleaned = sanitizeDisplayName(local);
  return cleaned.length > 0 ? cleaned : 'Friend';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Auth verification failed' });
  }

  // Optional client-provided display_name (e.g. the first name from Clerk).
  // When present and non-empty after sanitization, it overrides the fallback
  // and updates the existing row — solving the "everyone shows up as Friend"
  // case when the JWT lacked a usable email local-part.
  const body = req.body as { display_name?: unknown } | undefined;
  const clientName = typeof body?.display_name === 'string'
    ? sanitizeDisplayName(body.display_name)
    : '';
  const fallbackName = deriveDisplayName(user.email);
  const finalName = clientName.length > 0 ? clientName : fallbackName;

  try {
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO users (id, display_name)
      VALUES (${user.userId}, ${finalName})
      ON CONFLICT (id) DO UPDATE
        SET display_name = ${finalName},
            updated_at = NOW()
      RETURNING id, display_name, created_at, updated_at
    `) as unknown as UserRow[];

    const row = rows[0];
    if (!row) {
      // eslint-disable-next-line no-console
      console.error('[me] upsert returned no row');
      return res.status(500).json({ error: 'server_error' });
    }
    return res.status(200).json(row);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[me] db error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
