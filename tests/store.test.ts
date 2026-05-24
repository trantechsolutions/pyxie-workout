import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePyxie } from '../src/store/usePyxie';
import { DEFAULT_SETTINGS, DEFAULT_UI } from '../src/data/constants';

// Reset Zustand store state between cases.
function resetStore() {
  usePyxie.setState({
    pet: null,
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    installNudgeDismissed: false,
    ui: { ...DEFAULT_UI },
    deferredPrompt: null,
    evolved: null,
  });
  localStorage.clear();
}

describe('fireAlarm action', () => {
  beforeEach(resetStore);

  it('writes the supplied key into ui.lastAlarmFired', () => {
    usePyxie.getState().fireAlarm('Mon May 23 2026');
    expect(usePyxie.getState().ui.lastAlarmFired).toBe('Mon May 23 2026');
  });

  it('does not fire a browser Notification when permission is not granted', () => {
    // jsdom: Notification is undefined, so the guard returns false. No throw expected.
    expect(() => usePyxie.getState().fireAlarm('any')).not.toThrow();
  });

  it('does not fire a browser Notification when there is no pet', () => {
    const g = globalThis as { Notification?: unknown };
    const stub = vi.fn();
    (stub as { permission?: string }).permission = 'granted';
    g.Notification = stub;
    usePyxie.getState().fireAlarm('Mon May 23 2026');
    expect(stub).not.toHaveBeenCalled();
    delete g.Notification;
  });
});

describe('tickWorkout wall-clock model', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('derives remaining from segmentStartedAt + wall clock', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    usePyxie.setState((s) => ({
      ui: {
        ...s.ui,
        workoutActive: {
          segments: [{ kind: 'warmup', dur: 60, label: 'Warm up' }, { kind: 'work', dur: 45, label: 'X', idx: 1 }, { kind: 'cooldown', dur: 60, label: 'Cool down' }],
          segIdx: 0,
          remaining: 60,
          paused: false,
          startedAt: t0,
          segmentStartedAt: t0,
          pausedAt: null,
          exList: [{ name: 'X', cue: 'do X' }],
          intensity: 'medium',
          complexity: 'beginner', workCompleted: 0, workTotal: 1,
        },
      },
    }));
    vi.setSystemTime(t0 + 56_000); // 56s elapsed → 4s remaining
    usePyxie.getState().tickWorkout();
    expect(usePyxie.getState().ui.workoutActive?.remaining).toBe(4);
  });

  it('advances segIdx when elapsed reaches segment duration', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    usePyxie.setState((s) => ({
      ui: {
        ...s.ui,
        workoutActive: {
          segments: [{ kind: 'warmup', dur: 60, label: 'Warm up' }, { kind: 'work', dur: 45, label: 'X', idx: 1 }, { kind: 'cooldown', dur: 60, label: 'Cool down' }],
          segIdx: 0,
          remaining: 0,
          paused: false,
          startedAt: t0,
          segmentStartedAt: t0,
          pausedAt: null,
          exList: [{ name: 'X', cue: 'do X' }],
          intensity: 'medium',
          complexity: 'beginner', workCompleted: 0, workTotal: 1,
        },
      },
    }));
    vi.setSystemTime(t0 + 60_000);
    usePyxie.getState().tickWorkout();
    const w = usePyxie.getState().ui.workoutActive!;
    expect(w.segIdx).toBe(1);
    expect(w.remaining).toBe(45);
    expect(w.segmentStartedAt).toBe(t0 + 60_000);
  });

  it('is a no-op while paused even after wall-clock advances', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    usePyxie.setState((s) => ({
      ui: {
        ...s.ui,
        workoutActive: {
          segments: [{ kind: 'warmup', dur: 60, label: 'Warm up' }],
          segIdx: 0,
          remaining: 10,
          paused: true,
          startedAt: t0,
          segmentStartedAt: t0,
          pausedAt: t0,
          exList: [],
          intensity: 'medium',
          complexity: 'beginner', workCompleted: 0, workTotal: 1,
        },
      },
    }));
    vi.setSystemTime(t0 + 5_000);
    usePyxie.getState().tickWorkout();
    expect(usePyxie.getState().ui.workoutActive?.remaining).toBe(10);
  });

  it('increments workCompleted when a work segment finishes naturally', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    usePyxie.setState((s) => ({
      ui: {
        ...s.ui,
        workoutActive: {
          segments: [{ kind: 'work', dur: 45, label: 'A', idx: 1 }, { kind: 'rest', dur: 15, label: 'Rest' }, { kind: 'work', dur: 45, label: 'B', idx: 2 }],
          segIdx: 0, remaining: 0, paused: false,
          startedAt: t0, segmentStartedAt: t0, pausedAt: null,
          workCompleted: 0, workTotal: 2,
          exList: [], intensity: 'medium', complexity: 'beginner',
        },
      },
    }));
    vi.setSystemTime(t0 + 45_000);
    usePyxie.getState().tickWorkout();
    expect(usePyxie.getState().ui.workoutActive?.workCompleted).toBe(1);
  });

  it('skipSegment does NOT increment workCompleted', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    usePyxie.setState((s) => ({
      ui: {
        ...s.ui,
        workoutActive: {
          segments: [{ kind: 'work', dur: 45, label: 'A', idx: 1 }, { kind: 'rest', dur: 15, label: 'Rest' }, { kind: 'work', dur: 45, label: 'B', idx: 2 }],
          segIdx: 0, remaining: 45, paused: false,
          startedAt: t0, segmentStartedAt: t0, pausedAt: null,
          workCompleted: 0, workTotal: 2,
          exList: [], intensity: 'medium', complexity: 'beginner',
        },
      },
    }));
    usePyxie.getState().skipSegment();
    expect(usePyxie.getState().ui.workoutActive?.workCompleted).toBe(0);
    expect(usePyxie.getState().ui.workoutActive?.segIdx).toBe(1);
  });

  it('togglePause absorbs paused duration into segmentStartedAt on resume', () => {
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    usePyxie.setState((s) => ({
      ui: {
        ...s.ui,
        workoutActive: {
          segments: [{ kind: 'warmup', dur: 60, label: 'Warm up' }],
          segIdx: 0,
          remaining: 60,
          paused: false,
          startedAt: t0,
          segmentStartedAt: t0,
          pausedAt: null,
          exList: [],
          intensity: 'medium',
          complexity: 'beginner', workCompleted: 0, workTotal: 1,
        },
      },
    }));
    vi.setSystemTime(t0 + 10_000);
    usePyxie.getState().togglePause();
    expect(usePyxie.getState().ui.workoutActive?.paused).toBe(true);
    expect(usePyxie.getState().ui.workoutActive?.pausedAt).toBe(t0 + 10_000);
    vi.setSystemTime(t0 + 25_000); // paused for 15s
    usePyxie.getState().togglePause();
    const w = usePyxie.getState().ui.workoutActive!;
    expect(w.paused).toBe(false);
    expect(w.pausedAt).toBeNull();
    expect(w.segmentStartedAt).toBe(t0 + 15_000);
  });
});
