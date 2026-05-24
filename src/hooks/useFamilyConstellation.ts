import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchConstellation, FamilyApiError } from '../lib/familyApi';
import type { ConstellationResponse } from '../lib/familyTypes';

// ADR-0007: fetched on mount and on visibilitychange:visible, throttled to
// once per 30s. The hook treats 404 ("no_family") as a normal terminal
// state, not an error — a user who hasn't joined yet should see the empty
// state in the Family screen, not a red banner.

const REFETCH_THROTTLE_MS = 30 * 1000;

export interface UseFamilyConstellationResult {
  data: ConstellationResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFamilyConstellation(): UseFamilyConstellationResult {
  const [data, setData] = useState<ConstellationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);

  const run = useCallback(async (force: boolean) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < REFETCH_THROTTLE_MS) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const payload = await fetchConstellation();
      lastFetchRef.current = Date.now();
      setData(payload); // null = 404, treated as empty terminal state.
      setError(null);
    } catch (err) {
      // FamilyApiError with status 401 means "no session" — surface as
      // error so the UI can prompt sign-in. Other errors propagate.
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => { await run(true); }, [run]);

  useEffect(() => {
    void run(true);
    const onVis = () => {
      if (document.visibilityState === 'visible') void run(false);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); };
  }, [run]);

  return { data, loading, error, refetch };
}

export { FamilyApiError };
