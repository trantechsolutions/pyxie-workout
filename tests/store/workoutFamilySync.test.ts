import { describe, it, expect, beforeEach } from 'vitest';
import { usePyxie } from '../../src/store/usePyxie';
import { DEFAULT_SETTINGS, DEFAULT_UI } from '../../src/data/constants';
import { makePet, makeActiveWorkout } from '../helpers';

// ADR-0007 contract: a *completed* workout enqueues exactly one WorkoutEvent
// on the family-sync queue; a *skipped* workout does not.

function reset() {
  usePyxie.setState({
    pet: null,
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    installNudgeDismissed: false,
    ui: { ...DEFAULT_UI },
    deferredPrompt: null,
    evolved: null,
    eventQueue: [],
    inFamily: false,
  });
  localStorage.clear();
}

describe('finishWorkout -> familySyncSlice integration', () => {
  beforeEach(reset);

  it('enqueues a single event with correct fields on a completed workout', () => {
    usePyxie.setState({ pet: makePet({ alive: true, workoutsToHatch: 0 }) });
    usePyxie.setState((s) => ({
      ui: { ...s.ui, workoutActive: makeActiveWorkout({ intensity: 'hard', complexity: 'advanced' }) },
    }));

    expect(usePyxie.getState().eventQueue).toHaveLength(0);

    usePyxie.getState().finishWorkout(true);

    const q = usePyxie.getState().eventQueue;
    expect(q).toHaveLength(1);
    const evt = q[0];
    expect(evt.id).toMatch(/^[0-9a-f-]{36}$/i); // crypto.randomUUID shape
    expect(evt.intensity).toBe('hard');
    expect(evt.complexity).toBe('advanced');
    expect(typeof evt.xp_gained).toBe('number');
    expect(evt.xp_gained).toBeGreaterThan(0);
    expect(typeof evt.completed_at).toBe('number');
    expect(evt.completed_at).toBeGreaterThan(0);
  });

  it('does NOT enqueue an event when the workout is skipped (completed=false)', () => {
    usePyxie.setState({ pet: makePet({ alive: true }) });
    usePyxie.setState((s) => ({
      ui: { ...s.ui, workoutActive: makeActiveWorkout() },
    }));

    usePyxie.getState().finishWorkout(false);

    expect(usePyxie.getState().eventQueue).toHaveLength(0);
  });

  it('does NOT enqueue an event when there is no active workout', () => {
    usePyxie.setState({ pet: makePet({ alive: true }) });
    // No workoutActive set.
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);
  });

  it('does NOT enqueue an event when the pet is dead', () => {
    usePyxie.setState({ pet: makePet({ alive: false }) });
    usePyxie.setState((s) => ({
      ui: { ...s.ui, workoutActive: makeActiveWorkout() },
    }));
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().eventQueue).toHaveLength(0);
  });

  it('enqueues exactly N events across N completed workouts (queue grows monotonically)', () => {
    usePyxie.setState({ pet: makePet({ alive: true, workoutsToHatch: 0 }) });
    for (let i = 0; i < 5; i += 1) {
      usePyxie.setState((s) => ({
        ui: { ...s.ui, workoutActive: makeActiveWorkout() },
      }));
      usePyxie.getState().finishWorkout(true);
    }
    expect(usePyxie.getState().eventQueue).toHaveLength(5);
    // IDs must be unique.
    const ids = new Set(usePyxie.getState().eventQueue.map((e) => e.id));
    expect(ids.size).toBe(5);
  });
});
