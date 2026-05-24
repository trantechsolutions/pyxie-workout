import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from '../_lib/auth.js';
import { getSql } from '../_lib/db.js';
import { buildFamilyPayload, findFamilyForUser } from '../_lib/families.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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
    const payload = await buildFamilyPayload(sql, family);
    return res.status(200).json(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[families/mine] error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
