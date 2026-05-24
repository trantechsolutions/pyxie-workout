import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePyxie } from '../../src/store/usePyxie';
import { flushOnce } from '../../src/hooks/useSyncFlusher';
import type { WorkoutEvent } from '../../src/store/slices/familySyncSlice';

function event(id: string, completedAt = Date.now()): WorkoutEvent {
  return {
    id,
    completed_at: completedAt,
    intensity: 'medium',
    complexity: 'beginner',
    xp_gained: 22,
  };
}

const originalFetch = globalThis.fetch;

describe('flushOnce', () => {
  beforeEach(() => {
    usePyxie.setState({ eventQueue: [] });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('no-ops when there is no Clerk session', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    usePyxie.setState({ eventQueue: [event('a')] });
    await flushOnce({ fetchToken: async () => null });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(usePyxie.getState().eventQueue).toHaveLength(1);
  });

  it('POSTs events sequentially and removes them on 204', async () => {
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      calls.push(body.id);
      return new Response(null, { status: 204 });
    }) as unknown as typeof fetch;

    usePyxie.setState({ eventQueue: [event('a'), event('b'), event('c')] });
    await flushOnce({ fetchToken: async () => 'tok' });
    expect(calls).toEqual(['a', 'b', 'c']);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);
  });

  it('leaves event in queue on 5xx and stops draining', async () => {
    let n = 0;
    globalThis.fetch = vi.fn(async () => {
      n += 1;
      return new Response(null, { status: 500 });
    }) as unknown as typeof fetch;

    usePyxie.setState({ eventQueue: [event('a'), event('b')] });
    await flushOnce({ fetchToken: async () => 'tok' });
    expect(n).toBe(1);
    expect(usePyxie.getState().eventQueue).toHaveLength(2);
  });

  it('stops on 401 without dropping events', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 401 })) as unknown as typeof fetch;
    usePyxie.setState({ eventQueue: [event('a'), event('b')] });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await flushOnce({ fetchToken: async () => 'tok' });
    expect(usePyxie.getState().eventQueue).toHaveLength(2);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('FIFO drain even when fetch resolves in REVERSE order', async () => {
    // The flusher reads queue[0] each iteration and awaits before advancing,
    // so order is enforced by sequencing, not by promise-resolution order.
    // We assert: requests fire one-at-a-time in queue order, and removals
    // happen in FIFO order.
    const seenOrder: string[] = [];
    const removalOrder: string[] = [];
    const origMark = usePyxie.getState().markEventSynced;
    usePyxie.setState({
      markEventSynced: (id: string) => {
        removalOrder.push(id);
        origMark(id);
      },
    });

    // Build a deterministic delay per call. We assign descending delays to
    // earlier events so, naively, they'd resolve LAST. Sequencing must still
    // hold.
    let callIndex = 0;
    const delays = [50, 40, 30, 20, 10];
    globalThis.fetch = vi.fn((_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      const id = body.id as string;
      seenOrder.push(id);
      const delay = delays[callIndex] ?? 0;
      callIndex += 1;
      return new Promise<Response>((resolve) => {
        setTimeout(() => resolve(new Response(null, { status: 204 })), delay);
      });
    }) as unknown as typeof fetch;

    usePyxie.setState({
      eventQueue: [event('a'), event('b'), event('c'), event('d'), event('e')],
    });
    await flushOnce({ fetchToken: async () => 'tok' });

    // Even though earlier events had LONGER delays, calls fire in FIFO order.
    expect(seenOrder).toEqual(['a', 'b', 'c', 'd', 'e']);
    // And removals happen in FIFO order too.
    expect(removalOrder).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);

    // Restore.
    usePyxie.setState({ markEventSynced: origMark });
  });

  it('only one POST is in-flight at a time (next fires after prior resolves)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    globalThis.fetch = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      // Yield to the microtask queue to give any racing call a chance.
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return new Response(null, { status: 204 });
    }) as unknown as typeof fetch;

    usePyxie.setState({
      eventQueue: [event('a'), event('b'), event('c')],
    });
    await flushOnce({ fetchToken: async () => 'tok' });

    expect(maxInFlight).toBe(1);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);
  });

  it('leaves events in queue on network error', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    usePyxie.setState({ eventQueue: [event('a')] });
    await flushOnce({ fetchToken: async () => 'tok' });
    expect(usePyxie.getState().eventQueue).toHaveLength(1);
  });
});
