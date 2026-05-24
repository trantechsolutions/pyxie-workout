// ADR-0007: derive a member's family-constellation status from their most
// recent workout `completed_at`. Mirrors the SQL CASE expression in
// `api/family/constellation.ts` so the buckets stay in lockstep:
//
//   NULL                              -> sleeping
//   NOW() - completed_at <  1 day     -> active
//   NOW() - completed_at <  3 days    -> drifting
//   ELSE                              -> sleeping
//
// SQL `<` is strict, so the exact 1-day / 3-day boundary lands in the next
// bucket. Keep this helper pure so it's trivially unit-testable.

export type ConstellationStatus = 'active' | 'drifting' | 'sleeping';

const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveConstellationStatus(
  completedAt: number | string | null | undefined,
  now: number,
): ConstellationStatus {
  if (completedAt === null || completedAt === undefined) return 'sleeping';
  const ts = typeof completedAt === 'string' ? Date.parse(completedAt) : completedAt;
  if (!Number.isFinite(ts)) return 'sleeping';
  const delta = now - ts;
  if (delta < DAY_MS) return 'active';
  if (delta < 3 * DAY_MS) return 'drifting';
  return 'sleeping';
}
