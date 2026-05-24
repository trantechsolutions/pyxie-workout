import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from '../_lib/auth.js';
import { getSql } from '../_lib/db.js';
import { findFamilyForUser } from '../_lib/families.js';
import { invalidateFamilyCache } from '../family/constellation.js';

interface CountRow { count: string | number }
interface UserIdRow { user_id: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
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
      res.status(204);
      return res.end();
    }

    const isCreator = family.created_by === user.userId;

    // Chaos H3: if the leaver is the creator AND others remain, transfer
    // ownership to the next-oldest member before deleting the row, wrapped
    // in a transaction so a concurrent join can't observe a half state.
    let txnError: unknown = null;
    await sql`BEGIN`;
    try {
      await sql`
        DELETE FROM family_members
        WHERE family_id = ${family.id} AND user_id = ${user.userId}
      `;

      const countRows = (await sql`
        SELECT COUNT(*)::int AS count FROM family_members WHERE family_id = ${family.id}
      `) as unknown as CountRow[];
      const remaining = Number(countRows[0]?.count ?? 0);

      if (remaining === 0) {
        await sql`DELETE FROM families WHERE id = ${family.id}`;
      } else if (isCreator) {
        const nextRows = (await sql`
          SELECT user_id FROM family_members
          WHERE family_id = ${family.id}
          ORDER BY joined_at ASC
          LIMIT 1
        `) as unknown as UserIdRow[];
        const next = nextRows[0]?.user_id;
        if (next) {
          await sql`
            UPDATE families SET created_by = ${next} WHERE id = ${family.id}
          `;
        }
      }
      await sql`COMMIT`;
    } catch (err) {
      txnError = err;
      try { await sql`ROLLBACK`; } catch { /* ignored */ }
    }
    if (txnError) throw txnError;

    invalidateFamilyCache(family.id);

    res.status(204);
    return res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[families/membership] error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
