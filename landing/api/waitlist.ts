import type { VercelRequest, VercelResponse } from '@vercel/node';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_EMAIL_LEN = 254;
const MAX_UA_LEN = 512;

// Per-isolate sliding window. Acceptable for a low-traffic marketing form;
// see api/_lib/rateLimit.ts in the main app for the same pattern.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

function rateLimited(key: string, now = Date.now()): boolean {
  const cutoff = now - RATE_WINDOW_MS;
  const arr = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= RATE_LIMIT) {
    buckets.set(key, arr);
    return true;
  }
  arr.push(now);
  buckets.set(key, arr);
  return false;
}

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return (raw?.split(',')[0]?.trim()) || req.socket.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) ?? {};
  const email = String(body.email ?? '').trim().toLowerCase();
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : 'landing';

  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const ua = String(req.headers['user-agent'] ?? '').slice(0, MAX_UA_LEN);

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ ok: false, error: 'database_unconfigured' });
  }

  let neon: typeof import('@neondatabase/serverless').neon;
  try {
    ({ neon } = await import('@neondatabase/serverless'));
  } catch (err) {
    console.error('[waitlist] neon module load failed — is @neondatabase/serverless installed?', err);
    return res.status(500).json({ ok: false, error: 'driver_unavailable' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO waitlist_emails (email, source, user_agent, ip)
      VALUES (${email}, ${source}, ${ua}, ${ip})
      ON CONFLICT (email) DO NOTHING
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[waitlist] insert failed', err);
    // Surface DB error class so we can tell "table missing" vs "auth failed"
    // vs "network" from the client response without leaking the full message.
    let kind: 'table_missing' | 'auth' | 'connection' | 'insert_failed' = 'insert_failed';
    if (/relation .* does not exist/i.test(msg)) kind = 'table_missing';
    else if (/password authentication|role .* does not exist|permission denied/i.test(msg)) kind = 'auth';
    else if (/ENOTFOUND|ECONNREFUSED|getaddrinfo|TLS/i.test(msg)) kind = 'connection';
    return res.status(500).json({ ok: false, error: kind });
  }
}

function safeParse(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s); } catch { return null; }
}
