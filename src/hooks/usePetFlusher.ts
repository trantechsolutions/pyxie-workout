import { useEffect, useRef } from 'react';
import { usePyxie } from '../store/usePyxie';
import { loadClerk, getClerkSession } from '../lib/auth';
import {
  computePetSignature,
  getLastSignature,
  setLastSignature,
  getLastVersion,
  setLastVersion,
} from '../lib/petSyncState';

// ADR-009 M3: outbound write-through flusher for the canonical pet.
//
// Subscribes to the pet slice and PUTs to /api/pet when the user-visible
// state changes. Mirrors the architecture of `useSyncFlusher`:
//   - queue-like dedupe via signature (vs. event id)
//   - debounce instead of interval (pet mutations are bursty; 1Hz decay is
//     the common case so a 2s trailing-edge debounce keeps wire traffic low)
//   - immediate flush on `visibilitychange:hidden` and `online`
//
// Skip conditions (Section 5 of ADR-009):
//   - petHydrating === true        (hydration owns the wire)
//   - pet === null                 (nothing to push)
//   - no Clerk session token       (signed-out)
//   - signature unchanged          (no-op write)
//
// Version handling: outgoing PUTs include lastVersion + 1; the server's
// COALESCE upserts honor this. Successful response.version is captured. If
// the server returns a higher version than expected, we just store it —
// server is authoritative; v1 ships without conflict resolution.

const DEBOUNCE_MS = 2_000;

interface PetPutResponse {
  state: unknown;
  version: number;
  updatedAt: string;
}

interface FlushAttemptResult {
  status: 'sent' | 'skipped' | 'failed';
}

async function defaultFetchToken(): Promise<string | null> {
  const { token } = await getClerkSession();
  return token;
}

export interface PetFlusherDeps {
  fetchToken?: () => Promise<string | null>;
  signal?: AbortSignal;
}

/**
 * Single best-effort flush. Reads the current pet from the store, applies
 * skip conditions, and PUTs if the signature has changed. Returns the
 * outcome so callers (or tests) can introspect.
 */
export async function flushPetOnce(deps: PetFlusherDeps = {}): Promise<FlushAttemptResult> {
  const state = usePyxie.getState();
  if (state.petHydrating) return { status: 'skipped' };
  const pet = state.pet;
  if (!pet) return { status: 'skipped' };

  const signature = computePetSignature(pet);
  if (signature === getLastSignature()) return { status: 'skipped' };

  const getToken = deps.fetchToken ?? defaultFetchToken;
  const token = await getToken();
  if (!token) return { status: 'skipped' };

  const nextVersion = getLastVersion() + 1;
  let res: Response;
  try {
    res = await fetch('/api/pet', {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ state: pet, version: nextVersion }),
      signal: deps.signal,
    });
  } catch (err) {
    // Network error — keep lastSignature unchanged so the next mutation
    // (or lifecycle event) retries with the same data.
    // eslint-disable-next-line no-console
    console.warn('[usePetFlusher] network error', err);
    return { status: 'failed' };
  }

  if (res.status >= 200 && res.status < 300) {
    // Mark as synced. Local pet IS the source of truth from the client's
    // perspective; the response state is identical (we sent it).
    setLastSignature(signature);
    try {
      const body = (await res.json()) as PetPutResponse;
      if (typeof body.version === 'number') {
        // If the server returned a higher version than we expected (e.g. a
        // sibling device wrote in parallel), accept it. v1 has no conflict
        // resolution — server is authoritative.
        setLastVersion(body.version);
      } else {
        setLastVersion(nextVersion);
      }
    } catch {
      setLastVersion(nextVersion);
    }
    return { status: 'sent' };
  }

  // 4xx (besides auth) / 5xx — don't update signature so a retry happens
  // on the next mutation or lifecycle event.
  // eslint-disable-next-line no-console
  console.warn('[usePetFlusher] PUT failed status', res.status);
  return { status: 'failed' };
}

export function usePetFlusher(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runFlush = async () => {
      // Cancel any in-flight PUT so this attempt supersedes it.
      if (inFlightRef.current) {
        inFlightRef.current.abort();
      }
      const controller = new AbortController();
      inFlightRef.current = controller;
      try {
        if (!cancelled) await flushPetOnce({ signal: controller.signal });
      } finally {
        if (inFlightRef.current === controller) inFlightRef.current = null;
      }
    };

    const scheduleFlush = () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void runFlush();
      }, DEBOUNCE_MS);
    };

    const flushImmediately = () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void runFlush();
    };

    // Lazily ensure Clerk is loading so the session is ready by the time
    // we want to PUT. Same pattern as useSyncFlusher.
    void loadClerk().catch(() => {});

    // Subscribe to pet changes only. Trailing-edge debounce coalesces
    // bursts (taps, decay ticks) into a single PUT.
    let lastObservedPet = usePyxie.getState().pet;
    const unsubscribe = usePyxie.subscribe((state) => {
      if (state.pet !== lastObservedPet) {
        lastObservedPet = state.pet;
        scheduleFlush();
      }
    });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushImmediately();
    };
    const onOnline = () => { flushImmediately(); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      if (timerRef.current != null) clearTimeout(timerRef.current);
      if (inFlightRef.current) inFlightRef.current.abort();
    };
  }, []);
}
