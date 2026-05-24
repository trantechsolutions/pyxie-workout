import type { Intensity, Complexity } from '../types';
import type { PyxieSlice } from './types';
import type { FamilyPayload } from '../../lib/familyApi';

// ADR-0007: outbound sync queue. Bounded to 100 events; events older than
// 30 days are never enqueued. Server handles idempotency by UUID, so the
// client is intentionally naive (at-least-once with sequenced retries).
export const QUEUE_CAP = 100;
export const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
// Chaos H1: must mirror api/workout-events.ts FUTURE_TOLERANCE_MS so the
// client never enqueues an event the server will reject.
export const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export interface WorkoutEvent {
  id: string;
  completed_at: number;
  intensity: Intensity;
  complexity: Complexity;
  xp_gained: number;
}

export interface FamilySyncSlice {
  eventQueue: WorkoutEvent[];
  // ADR-0007: client-side mirror of family membership so the Nav can show
  // the Family tab without hitting the API on every render. Updated by the
  // family settings flow after a successful create/join/leave.
  inFamily: boolean;
  setInFamily: (value: boolean) => void;
  // Session-cached /api/families/mine payload. Populated once by
  // useFamilyMembershipProbe (or by create/join/leave/rotate mutations) so the
  // Settings → Family panel never refetches just because the user navigated
  // back to the tab. `familyHydrated` distinguishes "not loaded yet" from
  // "loaded and confirmed no family".
  familyPayload: FamilyPayload | null;
  familyHydrated: boolean;
  setFamilyPayload: (payload: FamilyPayload | null) => void;
  enqueueWorkoutEvent: (event: WorkoutEvent) => void;
  markEventSynced: (id: string) => void;
  dropOldestIfOverCap: () => void;
}

export const createFamilySyncSlice: PyxieSlice<FamilySyncSlice> = (set, get) => ({
  eventQueue: [],
  inFamily: false,
  setInFamily: (value) => set({ inFamily: value }),
  familyPayload: null,
  familyHydrated: false,
  setFamilyPayload: (payload) => set({
    familyPayload: payload,
    familyHydrated: true,
    inFamily: !!payload,
  }),

  enqueueWorkoutEvent: (event) => {
    if (Date.now() - event.completed_at > MAX_AGE_MS) {
      // Per ADR: stale events never enter the queue.
      // eslint-disable-next-line no-console
      console.warn('[familySync] dropping stale event', event.id);
      return;
    }
    if (event.completed_at - Date.now() > FUTURE_TOLERANCE_MS) {
      // Chaos H1: future-dated events would be rejected server-side; drop now.
      // eslint-disable-next-line no-console
      console.warn('[familySync] dropping future-dated event', event.id);
      return;
    }
    const next = [...get().eventQueue, event];
    if (next.length > QUEUE_CAP) {
      // eslint-disable-next-line no-console
      console.warn('[familySync] queue at cap; dropping oldest');
      next.splice(0, next.length - QUEUE_CAP);
    }
    set({ eventQueue: next });
  },

  markEventSynced: (id) => {
    set((s) => ({ eventQueue: s.eventQueue.filter((e) => e.id !== id) }));
  },

  dropOldestIfOverCap: () => {
    const q = get().eventQueue;
    if (q.length <= QUEUE_CAP) return;
    // eslint-disable-next-line no-console
    console.warn('[familySync] queue over cap; trimming');
    set({ eventQueue: q.slice(q.length - QUEUE_CAP) });
  },
});
