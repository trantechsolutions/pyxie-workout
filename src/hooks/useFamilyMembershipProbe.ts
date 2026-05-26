import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import { loadClerk } from '../lib/auth';
import { fetchMyFamily } from '../lib/familyApi';

// Probes /api/families/mine as soon as Clerk reports a signed-in user, so
// `inFamily` reflects reality before the user visits Settings. Without this,
// the Family nav tab stays hidden on Pet/Workout until the FamilySection
// component mounts and runs its own fetch. Mounted once in App.tsx.
//
// Polls Clerk for `loaded === true` on the same cadence as useClerkSignedIn,
// then probes once. Re-probes if the signed-in user id changes (account
// switch). Failures are non-blocking — `inFamily` falls back to false.
export function useFamilyMembershipProbe(): void {
  const setFamilyPayload = usePyxie((s) => s.setFamilyPayload);

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;
    let unsubscribe: (() => void) | undefined;
    let lastProbedUserId: string | null = null;
    let lastFailedAt: number | null = null;
    const FAILURE_RETRY_FLOOR_MS = 2000;

    type ClerkLike = {
      loaded?: boolean;
      user?: { id?: string } | null;
      session?: unknown;
      addListener?: (cb: () => void) => () => void;
    };

    const probe = async (userId: string) => {
      if (lastProbedUserId === userId) return;
      // Backoff: after a failed probe, gate retries for the same userId so a
      // hard-down server doesn't trigger a hot loop on every Clerk listener tick.
      if (lastFailedAt !== null && Date.now() - lastFailedAt < FAILURE_RETRY_FLOOR_MS) return;
      try {
        const result = await fetchMyFamily();
        // Only memoize on success — failed probes must remain retryable so a
        // transient 401 (e.g. session token not yet issuable) doesn't lock out
        // subsequent listener ticks for the rest of the session.
        lastProbedUserId = userId;
        lastFailedAt = null;
        if (!cancelled) setFamilyPayload(result);
      } catch {
        lastFailedAt = Date.now();
        if (!cancelled) setFamilyPayload(null);
      }
    };

    const read = () => {
      const w = window as unknown as { Clerk?: ClerkLike };
      const userId = w.Clerk?.user?.id ?? '';
      const signedIn = !!w.Clerk?.user && !!w.Clerk?.session;
      if (signedIn && userId) {
        void probe(userId);
      } else {
        if (lastProbedUserId !== null) {
          lastProbedUserId = null;
          setFamilyPayload(null);
        }
      }
    };

    void loadClerk()
      .then(() => {
        if (cancelled) return;
        const w = window as unknown as { Clerk?: ClerkLike };
        const attach = (): boolean => {
          if (cancelled) return true;
          if (!w.Clerk || w.Clerk.loaded !== true) return false;
          read();
          if (typeof w.Clerk.addListener === 'function') {
            unsubscribe = w.Clerk.addListener(read);
          }
          return true;
        };
        if (!attach()) {
          pollId = setInterval(() => { if (attach()) clearInterval(pollId); }, 100);
        }
      })
      .catch(() => { /* clerk-js unavailable — leave inFamily as-is */ });

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      unsubscribe?.();
    };
  }, [setFamilyPayload]);
}
