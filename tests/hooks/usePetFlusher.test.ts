import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePyxie } from '../../src/store/usePyxie';
import { flushPetOnce, usePetFlusher } from '../../src/hooks/usePetFlusher';
import {
  resetPetSyncState,
  getLastSignature,
  getLastVersion,
  computePetSignature,
  setLastSignature,
} from '../../src/lib/petSyncState';
import { makePet } from '../helpers';
import type { Pet } from '../../src/store/types';

const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  usePyxie.setState({ pet: null, petHydrating: false });
  resetPetSyncState();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ───────────────────────────────────────────────────────────────────────────
// flushPetOnce: behavior-level skip conditions + PUT semantics
// ───────────────────────────────────────────────────────────────────────────

describe('flushPetOnce', () => {
  it('skips when petHydrating === true', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    usePyxie.setState({ pet: makePet(), petHydrating: true });

    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips when pet === null', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    usePyxie.setState({ pet: null });

    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips when there is no Clerk token (signed-out)', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    usePyxie.setState({ pet: makePet() });

    const result = await flushPetOnce({ fetchToken: async () => null });
    expect(result.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips when signature matches lastSignature (no-op write)', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const pet = makePet({ name: 'Same' });
    usePyxie.setState({ pet });
    setLastSignature(computePetSignature(pet));

    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('PUTs when signature differs; updates lastSignature and lastVersion on success', async () => {
    const calls: { method: string; body?: string }[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const i = init as RequestInit | undefined;
      calls.push({ method: i?.method ?? 'GET', body: i?.body as string | undefined });
      return jsonResponse(200, { state: {}, version: 7, updatedAt: 'x' });
    }) as unknown as typeof fetch;

    const pet = makePet({ name: 'Fresh' });
    usePyxie.setState({ pet });

    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('sent');
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('PUT');
    const body = JSON.parse(calls[0].body ?? '{}');
    expect(body.state.name).toBe('Fresh');
    expect(typeof body.version).toBe('number');
    expect(getLastSignature()).toBe(computePetSignature(pet));
    expect(getLastVersion()).toBe(7);
  });

  it('outgoing PUT includes version = lastVersion + 1', async () => {
    let observedVersion: number | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      observedVersion = body.version;
      return jsonResponse(200, { state: {}, version: 5, updatedAt: 'x' });
    }) as unknown as typeof fetch;

    // Seed lastVersion to simulate a prior successful sync
    usePyxie.setState({ pet: makePet({ name: 'A' }) });
    await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(observedVersion).toBe(1); // 0 + 1

    // Next mutation -> version 6
    usePyxie.setState({ pet: makePet({ name: 'B' }) });
    await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(observedVersion).toBe(6); // 5 + 1
  });

  it('PUT failure (5xx) does NOT update lastSignature so a retry re-attempts', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn(async () => jsonResponse(500, { error: 'internal_error' })) as unknown as typeof fetch;

    const pet = makePet({ name: 'Retry' });
    usePyxie.setState({ pet });

    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('failed');
    expect(getLastSignature()).toBeNull();
    expect(getLastVersion()).toBe(0);
  });

  it('PUT network error does NOT update lastSignature', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;

    usePyxie.setState({ pet: makePet({ name: 'Net' }) });
    const result = await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(result.status).toBe('failed');
    expect(getLastSignature()).toBeNull();
  });

  it('captures a higher-than-expected server version (parallel device writes)', async () => {
    globalThis.fetch = vi.fn(async () =>
      // We sent version=1; server returns version=99 because another device
      // also wrote concurrently. Client accepts.
      jsonResponse(200, { state: {}, version: 99, updatedAt: 'x' })
    ) as unknown as typeof fetch;

    usePyxie.setState({ pet: makePet({ name: 'Parallel' }) });
    await flushPetOnce({ fetchToken: async () => 'tok' });
    expect(getLastVersion()).toBe(99);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// usePetFlusher: subscribe, debounce, lifecycle triggers
// ───────────────────────────────────────────────────────────────────────────

describe('usePetFlusher (mounted hook)', () => {
  it('coalesces rapid mutations within the debounce window into a single PUT', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, { state: {}, version: 1, updatedAt: 'x' })
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    // Mock Clerk session so the flusher gets a token without a real Clerk.
    (window as unknown as { Clerk?: unknown }).Clerk = {
      session: { getToken: async () => 'tok' },
    };

    const { unmount } = renderHook(() => usePetFlusher());

    // Three quick mutations
    usePyxie.setState({ pet: makePet({ name: 'M1' }) });
    vi.advanceTimersByTime(500);
    usePyxie.setState({ pet: makePet({ name: 'M2' }) });
    vi.advanceTimersByTime(500);
    usePyxie.setState({ pet: makePet({ name: 'M3' }) });

    // 1500ms elapsed total; not enough to flush
    expect(fetchSpy).not.toHaveBeenCalled();

    // Cross the 2s debounce
    vi.advanceTimersByTime(2_000);
    // Drain pending microtasks (fetch resolves async).
    await vi.runAllTimersAsync();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const callArgs = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const callBody = JSON.parse(callArgs[1].body as string);
    expect(callBody.state.name).toBe('M3'); // latest wins

    unmount();
    delete (window as unknown as { Clerk?: unknown }).Clerk;
  });

  it('mutation triggers PUT after 2s debounce', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, { state: {}, version: 1, updatedAt: 'x' })
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    (window as unknown as { Clerk?: unknown }).Clerk = {
      session: { getToken: async () => 'tok' },
    };

    const { unmount } = renderHook(() => usePetFlusher());
    usePyxie.setState({ pet: makePet({ name: 'X' }) });

    vi.advanceTimersByTime(1_999);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    await vi.runAllTimersAsync();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();
    delete (window as unknown as { Clerk?: unknown }).Clerk;
  });

  it('visibilitychange:hidden triggers immediate flush (bypasses debounce)', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, { state: {}, version: 1, updatedAt: 'x' })
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    (window as unknown as { Clerk?: unknown }).Clerk = {
      session: { getToken: async () => 'tok' },
    };

    const { unmount } = renderHook(() => usePetFlusher());
    usePyxie.setState({ pet: makePet({ name: 'Hide' }) });

    // Debounce not yet elapsed
    vi.advanceTimersByTime(100);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Simulate visibility -> hidden
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.runAllTimersAsync();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();
    delete (window as unknown as { Clerk?: unknown }).Clerk;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  it('online event triggers immediate flush', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, { state: {}, version: 1, updatedAt: 'x' })
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    (window as unknown as { Clerk?: unknown }).Clerk = {
      session: { getToken: async () => 'tok' },
    };

    const { unmount } = renderHook(() => usePetFlusher());
    usePyxie.setState({ pet: makePet({ name: 'Net' }) });

    vi.advanceTimersByTime(100);
    expect(fetchSpy).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('online'));
    await vi.runAllTimersAsync();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();
    delete (window as unknown as { Clerk?: unknown }).Clerk;
  });

  it('lifecycle flush still respects signature dedupe', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, { state: {}, version: 1, updatedAt: 'x' })
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    (window as unknown as { Clerk?: unknown }).Clerk = {
      session: { getToken: async () => 'tok' },
    };

    const pet: Pet = makePet({ name: 'Same' });
    usePyxie.setState({ pet });
    // Seed signature -- as if hydration just GET'd this exact pet.
    setLastSignature(computePetSignature(pet));

    const { unmount } = renderHook(() => usePetFlusher());

    // Lifecycle event with NO mutation since seeding.
    window.dispatchEvent(new Event('online'));
    await vi.runAllTimersAsync();

    expect(fetchSpy).not.toHaveBeenCalled();

    unmount();
    delete (window as unknown as { Clerk?: unknown }).Clerk;
  });
});
