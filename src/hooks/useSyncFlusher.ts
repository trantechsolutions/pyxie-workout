import { useEffect, useRef } from 'react';
import { usePyxie } from '../store/usePyxie';
import { loadClerk, getClerkSession } from '../lib/auth';
import type { WorkoutEvent } from '../store/slices/familySyncSlice';

// ADR-0007 outbound flusher. Always mounted in App; lazily resolves the Clerk
// session and no-ops while the user is not signed in (which is most users).
//
// Drain triggers:
//   - `online` event
//   - `visibilitychange` -> visible
//   - 30s interval while visible
// POSTs are sequenced so events arrive in order. Server-side idempotency
// (ON CONFLICT id DO NOTHING) handles dupes from at-least-once retries.

const INTERVAL_MS = 30 * 1000;

async function getActiveToken(): Promise<string | null> {
  // Delegates to the shared `getClerkSession` helper so the implicit
  // window.Clerk contract is owned in exactly one place.
  const { token } = await getClerkSession();
  return token;
}

async function postEvent(token: string, event: WorkoutEvent): Promise<number> {
  const res = await fetch('/api/workout-events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: event.id,
      completed_at: new Date(event.completed_at).toISOString(),
      intensity: event.intensity,
      complexity: event.complexity,
      xp_gained: event.xp_gained,
    }),
  });
  return res.status;
}

export interface FlusherDeps {
  fetchToken?: () => Promise<string | null>;
}

export async function flushOnce(deps: FlusherDeps = {}): Promise<void> {
  const getToken = deps.fetchToken ?? getActiveToken;
  const token = await getToken();
  if (!token) return;

  // Snapshot the queue; drain sequentially. Each iteration reads the live
  // queue from the store so concurrent enqueues are picked up.
  while (true) {
    const queue = usePyxie.getState().eventQueue;
    if (queue.length === 0) return;
    const next = queue[0];
    let status: number;
    try {
      status = await postEvent(token, next);
    } catch {
      // Network error — stop and let the next trigger retry.
      return;
    }
    if (status >= 200 && status < 300) {
      usePyxie.getState().markEventSynced(next.id);
      continue;
    }
    if (status === 401 || status === 403) {
      // eslint-disable-next-line no-console
      console.warn('[useSyncFlusher] auth rejected — pausing until next sign-in');
      return;
    }
    // 5xx or other transient — back off until the next trigger.
    return;
  }
}

export function useSyncFlusher(): void {
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function drain() {
      if (inFlightRef.current) return;
      if (usePyxie.getState().eventQueue.length === 0) return;
      // Lazily ensure the Clerk module is in flight (so the session is
      // ready by the time the user opens the family pane). This does not
      // block the no-session early return inside flushOnce.
      void loadClerk().catch(() => {});
      inFlightRef.current = true;
      try {
        if (!cancelled) await flushOnce();
      } finally {
        inFlightRef.current = false;
      }
    }

    const onOnline = () => { void drain(); };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void drain();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void drain();
    }, INTERVAL_MS);

    // First-mount opportunistic drain.
    void drain();

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(id);
    };
  }, []);
}
