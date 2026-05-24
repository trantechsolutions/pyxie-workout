import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from '../_lib/auth.js';
import { getSql } from '../_lib/db.js';
import {
  buildFamilyPayload,
  findFamilyForUser,
  generateInviteCode,
  type FamilyRow,
} from '../_lib/families.js';

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

  const body = req.body as { name?: unknown } | undefined;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 40) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  try {
    const sql = getSql();

    const existing = await findFamilyForUser(sql, user.userId);
    if (existing) {
      return res.status(409).json({ error: 'Already in a family' });
    }

    let created: FamilyRow | null = null;
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateInviteCode();
      const rows = (await sql`
        INSERT INTO families (name, invite_code, created_by)
        VALUES (${name}, ${code}, ${user.userId})
        ON CONFLICT (invite_code) DO NOTHING
        RETURNING id, name, invite_code, created_by
      `) as unknown as FamilyRow[];
      if (rows[0]) {
        created = rows[0];
        break;
      }
    }
    if (!created) {
      // eslint-disable-next-line no-console
      console.error('[families/create] code allocation exhausted');
      return res.status(500).json({ error: 'server_error' });
    }

    await sql`
      INSERT INTO family_members (family_id, user_id)
      VALUES (${created.id}, ${user.userId})
      ON CONFLICT DO NOTHING
    `;

    const payload = await buildFamilyPayload(sql, created);
    return res.status(201).json(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[families/create] error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
