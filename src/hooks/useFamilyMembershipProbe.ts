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

    type ClerkLike = {
      loaded?: boolean;
      user?: { id?: string } | null;
      session?: unknown;
      addListener?: (cb: () => void) => () => void;
    };

    const probe = async (userId: string) => {
      if (lastProbedUserId === userId) return;
      lastProbedUserId = userId;
      try {
        const result = await fetchMyFamily();
        if (!cancelled) setFamilyPayload(result);
      } catch {
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
