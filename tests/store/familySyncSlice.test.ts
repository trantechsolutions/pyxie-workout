import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePyxie } from '../../src/store/usePyxie';
import { QUEUE_CAP, type WorkoutEvent } from '../../src/store/slices/familySyncSlice';

function makeEvent(over: Partial<WorkoutEvent> = {}): WorkoutEvent {
  return {
    id: over.id ?? crypto.randomUUID(),
    completed_at: over.completed_at ?? Date.now(),
    intensity: over.intensity ?? 'medium',
    complexity: over.complexity ?? 'beginner',
    xp_gained: over.xp_gained ?? 22,
  };
}

describe('familySyncSlice', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    usePyxie.setState({ eventQueue: [] });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('enqueues a fresh event', () => {
    const e = makeEvent();
    usePyxie.getState().enqueueWorkoutEvent(e);
    expect(usePyxie.getState().eventQueue).toEqual([e]);
  });

  it('does NOT dedup client-side (server handles)', () => {
    const e = makeEvent();
    usePyxie.getState().enqueueWorkoutEvent(e);
    usePyxie.getState().enqueueWorkoutEvent({ ...e });
    expect(usePyxie.getState().eventQueue).toHaveLength(2);
  });

  it('caps the queue at 100, dropping oldest', () => {
    for (let i = 0; i < QUEUE_CAP + 5; i += 1) {
      usePyxie.getState().enqueueWorkoutEvent(makeEvent({ id: `e-${i}` }));
    }
    const q = usePyxie.getState().eventQueue;
    expect(q).toHaveLength(QUEUE_CAP);
    expect(q[0].id).toBe('e-5');
    expect(q[q.length - 1].id).toBe(`e-${QUEUE_CAP + 4}`);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('rejects events older than 30 days', () => {
    const stale = makeEvent({ completed_at: Date.now() - 31 * 24 * 60 * 60 * 1000 });
    usePyxie.getState().enqueueWorkoutEvent(stale);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('accepts events at the +5min future tolerance boundary (Chaos H1)', () => {
    const atBoundary = makeEvent({ completed_at: Date.now() + 5 * 60 * 1000 });
    usePyxie.getState().enqueueWorkoutEvent(atBoundary);
    expect(usePyxie.getState().eventQueue).toHaveLength(1);
  });

  it('drops events past the +5min future tolerance (Chaos H1)', () => {
    const tooFar = makeEvent({ completed_at: Date.now() + 5 * 60 * 1000 + 1_500 });
    usePyxie.getState().enqueueWorkoutEvent(tooFar);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('markEventSynced removes the event', () => {
    const a = makeEvent({ id: 'a' });
    const b = makeEvent({ id: 'b' });
    usePyxie.getState().enqueueWorkoutEvent(a);
    usePyxie.getState().enqueueWorkoutEvent(b);
    usePyxie.getState().markEventSynced('a');
    expect(usePyxie.getState().eventQueue.map((e) => e.id)).toEqual(['b']);
  });
});
