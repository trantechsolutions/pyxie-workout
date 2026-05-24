import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, AuthError } from '../_lib/auth.js';
import { getSql } from '../_lib/db.js';
import { findFamilyForUser } from '../_lib/families.js';
import { deriveConstellationStatus } from '../_lib/status.js';

// ADR-0007: lightweight in-memory response cache keyed on family_id.
// Acceptable for v1 single-region deployments — Vercel Functions can run on
// multiple isolates so this is best-effort, not authoritative. Lives at module
// scope; isolate cold-start clears it.
const CACHE_TTL_MS = 30 * 1000;
interface CacheEntry { data: ConstellationResponse; expiresAt: number }
const responseCache = new Map<string, CacheEntry>();

export type ConstellationStatus = 'active' | 'drifting' | 'sleeping';

export interface ConstellationSprite {
  line: string;
  stage: number;
  lineage_id: string;
  sprite_state: Record<string, unknown>;
}

export interface ConstellationMember {
  user_id: string;
  display_name: string;
  sprite: ConstellationSprite | null;
  last_activity_at: string | null;
  status: ConstellationStatus;
}

export interface ConstellationResponse {
  family: { id: string; name: string; invite_code: string };
  members: ConstellationMember[];
}

interface MemberRow {
  user_id: string;
  display_name: string;
  joined_at: string;
  line: string | null;
  stage: number | null;
  lineage_id: string | null;
  sprite_state: Record<string, unknown> | null;
  last_activity_at: string | null;
  status: ConstellationStatus;
}

function buildResponse(
  family: { id: string; name: string; invite_code: string },
  rows: MemberRow[],
  callerId: string,
  now: number = Date.now(),
): ConstellationResponse {
  const members: ConstellationMember[] = rows.map((r) => {
    // Defense-in-depth (qa-engineer follow-up): re-derive status in TS from
    // last_activity_at. If the SQL CASE and the TS helper ever drift, the
    // TS version wins so a single source-of-truth keeps the UI predictable.
    const derived = deriveConstellationStatus(r.last_activity_at, now);
    return {
      user_id: r.user_id,
      display_name: r.display_name,
      sprite: r.line && r.stage !== null && r.lineage_id
        ? {
            line: r.line,
            stage: r.stage,
            lineage_id: r.lineage_id,
            sprite_state: r.sprite_state ?? {},
          }
        : null,
      last_activity_at: r.last_activity_at,
      status: derived,
    };
  });
  // Caller first, then by joined_at (already pre-sorted by SQL).
  members.sort((a, b) => {
    if (a.user_id === callerId) return -1;
    if (b.user_id === callerId) return 1;
    return 0;
  });
  return {
    family: { id: family.id, name: family.name, invite_code: family.invite_code },
    members,
  };
}

export function __resetConstellationCacheForTests(): void {
  responseCache.clear();
}

// Chaos M6: any mutation that changes membership, the invite code, or the
// creator must invalidate the cached constellation response for the family.
// Callers in join.ts / membership.ts / rotate-code.ts invoke this after their
// SQL completes successfully.
export function invalidateFamilyCache(familyId: string): void {
  responseCache.delete(familyId);
}

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
      return res.status(404).json({ error: 'no_family' });
    }

    const now = Date.now();
    const cached = responseCache.get(family.id);
    if (cached && cached.expiresAt > now) {
      // Re-sort by caller for the current requester (cache is per-family,
      // not per-user, so we may need to flip the head).
      const fresh = buildResponse(
        family,
        cached.data.members.map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          joined_at: '',
          line: m.sprite?.line ?? null,
          stage: m.sprite?.stage ?? null,
          lineage_id: m.sprite?.lineage_id ?? null,
          sprite_state: m.sprite?.sprite_state ?? null,
          last_activity_at: m.last_activity_at,
          status: m.status,
        })),
        user.userId,
      );
      return res.status(200).json(fresh);
    }

    const rows = (await sql`
      SELECT
        fm.user_id,
        u.display_name,
        fm.joined_at,
        ps.line,
        ps.stage,
        ps.lineage_id,
        ps.sprite_state,
        ev.completed_at AS last_activity_at,
        CASE
          WHEN ev.completed_at IS NULL THEN 'sleeping'
          WHEN NOW() - ev.completed_at < INTERVAL '1 day' THEN 'active'
          WHEN NOW() - ev.completed_at < INTERVAL '3 days' THEN 'drifting'
          ELSE 'sleeping'
        END AS status
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      LEFT JOIN pet_snapshots ps ON ps.user_id = fm.user_id
      LEFT JOIN LATERAL (
        SELECT completed_at
        FROM workout_events we
        WHERE we.user_id = fm.user_id
        ORDER BY completed_at DESC
        LIMIT 1
      ) ev ON TRUE
      WHERE fm.family_id = ${family.id}
      ORDER BY fm.joined_at ASC
    `) as unknown as MemberRow[];

    const payload = buildResponse(family, rows, user.userId);
    responseCache.set(family.id, { data: payload, expiresAt: now + CACHE_TTL_MS });
    return res.status(200).json(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[family/constellation] error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
