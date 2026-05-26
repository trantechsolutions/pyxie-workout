import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import { loadClerk, getClerkSession } from '../lib/auth';
import type { Pet } from '../store/types';
import {
  computePetSignature,
  setLastSignature,
  setLastVersion,
  resetPetSyncState,
} from '../lib/petSyncState';

// ADR-009 M2: hydrate the canonical pet from the server on Clerk sign-in.
//
// Sequence (Section 5 of ADR-009):
//   set petHydrating = true
//   try:
//     GET /api/pet
//     200 -> replacePet(response.body.state)        // server is authoritative
//     404 + local pet -> PUT { state: localPet }    // first-time migration
//     404 + no local  -> replacePet(null)           // brand-new user
//     5xx / network   -> keep local pet, warn       // offline fallback
//   finally:
//     setPetHydrating(false)
//
// The PUT (first-time migration) MUST complete before petHydrating clears,
// otherwise the kid could tap the pet, trigger a mutation, and have the
// migration PUT clobber the local mutation in a race window. We await it
// inside the try block — the `finally` is the only clearing site.
//
// Sign-out: M2 deliberately leaves localStorage alone (M4's job). On
// signed-out we just clear the hydrating flag if it's still set.
//
// Mirrors the Clerk-listener pattern in useFamilyMembershipProbe: poll for
// Clerk.loaded, then attach addListener and run an initial read. The hook
// runs the GET at most ONCE per signed-in user per page load (per-userId
// guard — a sign-out + different sign-in will re-hydrate, which is correct).

type ClerkLike = {
  loaded?: boolean;
  user?: { id?: string } | null;
  session?: unknown;
  addListener?: (cb: () => void) => () => void;
};

interface PetGetResponse {
  state: unknown;
  version: number;
  updatedAt: string;
}

export interface PetHydrationDeps {
  fetchToken?: () => Promise<string | null>;
}

async function fetchToken(): Promise<string | null> {
  const { token } = await getClerkSession();
  return token;
}

export async function hydratePetOnce(deps: PetHydrationDeps = {}): Promise<void> {
  const getToken = deps.fetchToken ?? fetchToken;
  const { replacePet, setPetHydrating } = usePyxie.getState();
  setPetHydrating(true);
  try {
    const token = await getToken();
    if (!token) {
      // No session token — can't fetch. Leave the local pet untouched.
      return;
    }
    let res: Response;
    try {
      res = await fetch('/api/pet', {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[usePetHydration] network error', err);
      return;
    }

    if (res.status === 200) {
      const body = (await res.json()) as PetGetResponse;
      // Server is authoritative — replace whatever localStorage had.
      replacePet(body.state as Pet);
      // ADR-009 M3: seed the flusher's sync cursor so the first observed
      // state change (which is THIS replacePet) is not pushed back to the
      // server as a redundant PUT.
      setLastSignature(computePetSignature(body.state));
      setLastVersion(body.version);
      return;
    }

    if (res.status === 404) {
      const localPet = usePyxie.getState().pet;
      if (localPet) {
        // First-time migration: push the local pet to the server so the kid's
        // OTHER device can fetch it on next sign-in. Keep the local pet — it
        // is now mirrored on the server.
        try {
          const putRes = await fetch('/api/pet', {
            method: 'PUT',
            headers: {
              authorization: `Bearer ${token}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ state: localPet }),
          });
          if (putRes.ok) {
            // ADR-009 M3: seed flusher cursor so the flusher doesn't
            // immediately re-PUT the same state we just migrated.
            setLastSignature(computePetSignature(localPet));
            try {
              const body = (await putRes.json()) as PetGetResponse;
              if (typeof body.version === 'number') setLastVersion(body.version);
            } catch {
              // Body not JSON — version stays at default; next successful
              // flusher PUT will sync up.
            }
          }
        } catch (err) {
          // Migration failed — non-fatal. The next mutation in M3 will retry.
          // eslint-disable-next-line no-console
          console.warn('[usePetHydration] first-time migration PUT failed', err);
        }
        return;
      }
      // Brand-new user, no pet anywhere. Hatch screen will render after gate.
      replacePet(null);
      // ADR-009 M3: seed signature for null so the flusher doesn't try to
      // push a null pet when it observes the replacePet(null) transition.
      setLastSignature(computePetSignature(null));
      return;
    }

    // 5xx or other unexpected status — keep local pet, log.
    // eslint-disable-next-line no-console
    console.warn('[usePetHydration] unexpected status', res.status);
  } finally {
    setPetHydrating(false);
  }
}

export function usePetHydration(): void {
  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;
    let unsubscribe: (() => void) | undefined;
    let hydratedForUserId: string | null = null;

    const read = () => {
      if (cancelled) return;
      const w = window as unknown as { Clerk?: ClerkLike };
      const userId = w.Clerk?.user?.id ?? '';
      const signedIn = !!w.Clerk?.user && !!w.Clerk?.session;
      if (signedIn && userId) {
        if (hydratedForUserId === userId) return;
        hydratedForUserId = userId;
        void hydratePetOnce();
      } else {
        // Signed-out: M2 leaves localStorage alone. Just ensure we're not
        // stuck in `petHydrating === true` if the user never signs in.
        if (hydratedForUserId !== null) {
          hydratedForUserId = null;
          // ADR-009 M3: clear the flusher cursor so a fresh sign-in doesn't
          // inherit a previous user's signature/version.
          resetPetSyncState();
        }
        const { petHydrating, setPetHydrating } = usePyxie.getState();
        if (petHydrating) setPetHydrating(false);
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
      .catch(() => {
        // Clerk unavailable — clear the hydrating flag so the unauth user
        // sees the existing localStorage-backed UI rather than a stuck loader.
        if (cancelled) return;
        const { petHydrating, setPetHydrating } = usePyxie.getState();
        if (petHydrating) setPetHydrating(false);
      });

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      unsubscribe?.();
    };
  }, []);
}
