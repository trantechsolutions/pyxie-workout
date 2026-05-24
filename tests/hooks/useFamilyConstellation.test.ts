import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFamilyConstellation } from '../../src/hooks/useFamilyConstellation';

const originalFetch = globalThis.fetch;

function mockClerkSession(token: string | null) {
  (window as unknown as { Clerk?: unknown }).Clerk = token
    ? { session: { getToken: async () => token } }
    : undefined;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  mockClerkSession('tok');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  delete (window as unknown as { Clerk?: unknown }).Clerk;
});

describe('useFamilyConstellation', () => {
  it('fetches on mount and exposes data', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'F', invite_code: 'XYZ123' },
      members: [],
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.family.id).toBe('fam_1');
    expect(result.current.error).toBeNull();
  });

  it('treats 404 as a normal terminal state with null data', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(404, { error: 'no_family' })) as unknown as typeof fetch;
    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('surfaces non-404 errors', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(500, { error: 'boom' })) as unknown as typeof fetch;
    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it('throttles visibility refetches to once per 30s', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'F', invite_code: 'XYZ123' },
      members: [],
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Visibility flip within the throttle window should be a no-op.
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('three visibility events within 30s -> only the initial mount fetch fires', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'F', invite_code: 'XYZ123' },
      members: [],
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    // Still 1 — all three were inside the throttle window.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('visibility event AFTER 30s elapses triggers a second fetch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchSpy = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'F', invite_code: 'XYZ123' },
      members: [],
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Inside the throttle window.
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Step past 30s and fire again.
    await act(async () => {
      vi.advanceTimersByTime(30_001);
    });
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    vi.useRealTimers();
  });

  it('refetch() forces a new request', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'F', invite_code: 'XYZ123' },
      members: [],
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const { result } = renderHook(() => useFamilyConstellation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.refetch(); });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
