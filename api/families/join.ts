import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from '../_lib/auth.js';
import { getSql } from '../_lib/db.js';
import {
  buildFamilyPayload,
  FAMILY_MEMBER_CAP,
  findFamilyForUser,
  type FamilyRow,
} from '../_lib/families.js';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { invalidateFamilyCache } from '../family/constellation.js';

interface CountRow { count: string | number }

// Chaos H2: 10 join attempts per user per 10 minutes. Cheap to compute,
// raises the brute-force bar against random-code guessing significantly.
const JOIN_RATE_LIMIT = 10;
const JOIN_RATE_WINDOW_MS = 10 * 60 * 1000;

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

  // Rate-limit before doing any DB work — cheap rejection of abusive clients.
  const limit = checkRateLimit(`join:${user.userId}`, JOIN_RATE_LIMIT, JOIN_RATE_WINDOW_MS);
  if (!limit.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: 'rate_limited',
      retryAfterMs: limit.retryAfterMs,
    });
  }

  const body = req.body as { invite_code?: unknown } | undefined;
  const inviteCode = typeof body?.invite_code === 'string' ? body.invite_code.trim().toUpperCase() : '';
  if (inviteCode.length === 0) {
    return res.status(400).json({ error: 'Invalid invite_code' });
  }

  try {
    const sql = getSql();

    const existing = await findFamilyForUser(sql, user.userId);
    if (existing) {
      return res.status(409).json({ error: 'Already in a family' });
    }

    const familyRows = (await sql`
      SELECT id, name, invite_code, created_by
      FROM families
      WHERE invite_code = ${inviteCode}
      LIMIT 1
    `) as unknown as FamilyRow[];
    const family = familyRows[0];
    if (!family) {
      return res.status(404).json({ error: 'Unknown invite code' });
    }

    // Chaos M4: serialize the count + insert so two concurrent joins at the
    // 7th slot can't both succeed and push the family past FAMILY_MEMBER_CAP.
    // Neon's tagged-template sql doesn't expose a transaction helper from
    // the client, but raw BEGIN/COMMIT works. ROLLBACK on any error.
    let cappedOut = false;
    let txnError: unknown = null;
    await sql`BEGIN`;
    try {
      // Lock the family row so a concurrent join blocks here.
      await sql`SELECT id FROM families WHERE id = ${family.id} FOR UPDATE`;
      const countRows = (await sql`
        SELECT COUNT(*)::int AS count FROM family_members WHERE family_id = ${family.id}
      `) as unknown as CountRow[];
      const memberCount = Number(countRows[0]?.count ?? 0);
      if (memberCount >= FAMILY_MEMBER_CAP) {
        cappedOut = true;
      } else {
        await sql`
          INSERT INTO family_members (family_id, user_id)
          VALUES (${family.id}, ${user.userId})
          ON CONFLICT DO NOTHING
        `;
      }
      await sql`COMMIT`;
    } catch (err) {
      txnError = err;
      try { await sql`ROLLBACK`; } catch { /* ignored */ }
    }
    if (txnError) throw txnError;
    if (cappedOut) {
      return res.status(409).json({ error: 'family_full' });
    }

    invalidateFamilyCache(family.id);
    const payload = await buildFamilyPayload(sql, family);
    return res.status(200).json(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[families/join] error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
