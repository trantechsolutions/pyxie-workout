import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from '../_lib/auth.js';
import { getSql } from '../_lib/db.js';
import { findFamilyForUser, generateInviteCode } from '../_lib/families.js';
import { invalidateFamilyCache } from '../family/constellation.js';

const MAX_CODE_ATTEMPTS = 10;

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

  try {
    const sql = getSql();
    const family = await findFamilyForUser(sql, user.userId);
    if (!family) {
      return res.status(404).json({ error: 'No family' });
    }
    // Chaos H3: orphaned families (creator deleted their account) have a
    // null created_by. Any remaining member may claim ownership by being
    // the first to rotate. The claim and rotation happen in one update.
    const isCreator = family.created_by === user.userId;
    const isOrphan = family.created_by === null || family.created_by === undefined;
    if (!isCreator && !isOrphan) {
      return res.status(403).json({ error: 'Only the creator may rotate the code' });
    }

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateInviteCode();
      const updated = (await sql`
        UPDATE families
        SET
          invite_code = ${code},
          created_by = CASE
            WHEN created_by IS NULL THEN ${user.userId}
            ELSE created_by
          END
        WHERE id = ${family.id}
          AND NOT EXISTS (
            SELECT 1 FROM families WHERE invite_code = ${code} AND id <> ${family.id}
          )
        RETURNING invite_code
      `) as unknown as { invite_code: string }[];
      if (updated[0]) {
        invalidateFamilyCache(family.id);
        return res.status(200).json({ invite_code: updated[0].invite_code });
      }
    }
    // eslint-disable-next-line no-console
    console.error('[families/rotate-code] code allocation exhausted');
    return res.status(500).json({ error: 'server_error' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[families/rotate-code] error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
