import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePyxie } from '../src/store/usePyxie';
import { computeStreak, applyWorkoutResult, clampAlarm, streakMultiplier } from '../src/lib/progression';
import { resetStore, makePet, makeActiveWorkout, makeHistory } from './helpers';

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;

describe('computeStreak', () => {
  it('returns 1 when there is no prior workout', () => {
    expect(computeStreak(makePet({ lastWorkout: null, streak: 0 }), T0)).toBe(1);
    expect(computeStreak(makePet({ lastWorkout: null, streak: 7 }), T0)).toBe(1);
  });

  it('preserves streak when the prior workout was today (0 days ago)', () => {
    expect(computeStreak(makePet({ lastWorkout: T0, streak: 5 }), T0 + 60_000)).toBe(5);
  });

  it('increments streak when the prior workout was exactly 1 day ago', () => {
    expect(computeStreak(makePet({ lastWorkout: T0, streak: 5 }), T0 + DAY)).toBe(6);
  });

  it('resets streak to 1 when 2+ days have passed', () => {
    expect(computeStreak(makePet({ lastWorkout: T0, streak: 10 }), T0 + 2 * DAY)).toBe(1);
    expect(computeStreak(makePet({ lastWorkout: T0, streak: 10 }), T0 + 7 * DAY)).toBe(1);
  });
});

describe('streakMultiplier', () => {
  it('returns 1.0 on streak 1 (day one)', () => {
    expect(streakMultiplier(1)).toBe(1);
    expect(streakMultiplier(0)).toBe(1);
  });

  it('adds 5% per consecutive day after day one', () => {
    expect(streakMultiplier(2)).toBeCloseTo(1.05, 5);
    expect(streakMultiplier(7)).toBeCloseTo(1.30, 5);
    expect(streakMultiplier(11)).toBeCloseTo(1.50, 5);
  });

  it('caps at 2.0× on day 21 and beyond', () => {
    expect(streakMultiplier(21)).toBeCloseTo(2.0, 5);
    expect(streakMultiplier(30)).toBeCloseTo(2.0, 5);
    expect(streakMultiplier(500)).toBeCloseTo(2.0, 5);
  });
});

describe('applyWorkoutResult', () => {
  it('awards xpFor(intensity, complexity) and updates stats/streak/lastWorkout', () => {
    const pet = makePet({ xp: 0, streak: 0, lastWorkout: null, hunger: 50, happiness: 50, energy: 50 });
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0);
    expect(r.xpGained).toBe(22);
    expect(r.pet.xp).toBe(22);
    expect(r.pet.streak).toBe(1);
    expect(r.pet.lastWorkout).toBe(T0);
    expect(r.pet.hunger).toBe(78);
    expect(r.pet.happiness).toBe(72);
    expect(r.pet.energy).toBe(68);
    expect(r.evolved).toBeNull();
  });

  it('flags evolved when xp crosses the next stage threshold', () => {
    const pet = makePet({ stage: 0, xp: 40, lastWorkout: T0 });
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0 + DAY);
    expect(r.pet.xp).toBe(62);
    expect(r.pet.stage).toBe(1);
    expect(r.evolved).not.toBeNull();
    expect(r.evolved?.from).toBe(0);
    expect(r.evolved?.pet.stage).toBe(1);
  });

  it('does not evolve past the final stage', () => {
    const pet = makePet({ stage: 4, xp: 5000, lastWorkout: T0 });
    const r = applyWorkoutResult(pet, 'hard', 'advanced', T0 + DAY);
    expect(r.pet.stage).toBe(4);
    expect(r.evolved).toBeNull();
  });

  it('multiplies xpGained by the post-workout streak multiplier', () => {
    // pet with streak 6 from a workout exactly 1 day ago → new streak = 7 → mult 1.30
    const pet = makePet({ xp: 0, streak: 6, lastWorkout: T0 });
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0 + DAY);
    expect(r.pet.streak).toBe(7);
    // base 22 * 1.30 = 28.6 → round → 29
    expect(r.xpGained).toBe(29);
  });

  it('combines effort and streak multipliers', () => {
    const pet = makePet({ xp: 0, streak: 6, lastWorkout: T0 });
    // 0.5 effort * 1.30 streak * 22 base = 14.3 → round → 14
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0 + DAY, 0.5);
    expect(r.xpGained).toBe(14);
  });

  it('walks the tree to a primary child on evolution when intensity favors primary', () => {
    // Cross the stage-1 threshold (xp 0 → 60). Counts: easy-heavy.
    const pet = makePet({
      xp: 59, lastWorkout: null, lineageId: 'ember',
      workoutCounts: { intensity: { easy: 4, medium: 0, hard: 0 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
    });
    const r = applyWorkoutResult(pet, 'easy', 'beginner', T0);
    expect(r.evolved).not.toBeNull();
    expect(r.pet.lineageId).toBe('ember-p');
  });

  it('walks the tree to an alt child when hard-intensity dominates', () => {
    const pet = makePet({
      xp: 59, lastWorkout: null, lineageId: 'ember',
      workoutCounts: { intensity: { easy: 0, medium: 0, hard: 6 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
    });
    const r = applyWorkoutResult(pet, 'hard', 'beginner', T0);
    expect(r.pet.lineageId).toBe('ember-a');
  });

  it('does not mutate lineageId when not crossing an evolution threshold', () => {
    const pet = makePet({ xp: 10, lineageId: 'ember-p' });
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0 + DAY);
    expect(r.evolved).toBeNull();
    expect(r.pet.lineageId).toBe('ember-p');
  });

  it('caps streak multiplier contribution at 2.0×', () => {
    const pet = makePet({ xp: 0, streak: 29, lastWorkout: T0 });
    // new streak 30 → mult 2.0 → 22 * 2 = 44
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0 + DAY);
    expect(r.pet.streak).toBe(30);
    expect(r.xpGained).toBe(44);
  });

  it('scales xpGained by xpMultiplier', () => {
    const pet = makePet({ xp: 0, lastWorkout: null });
    // base xp medium/beginner = 22; half credit → 11
    const r = applyWorkoutResult(pet, 'medium', 'beginner', T0, 0.5);
    expect(r.xpGained).toBe(11);
    expect(r.pet.xp).toBe(11);
  });

  it('clamps xpMultiplier to [0,1]', () => {
    const pet = makePet({ xp: 0, lastWorkout: null });
    expect(applyWorkoutResult(pet, 'medium', 'beginner', T0, -1).xpGained).toBe(0);
    expect(applyWorkoutResult(pet, 'medium', 'beginner', T0, 5).xpGained).toBe(22);
  });

  it('clamps stat gains at 100', () => {
    const pet = makePet({ hunger: 90, happiness: 90, energy: 90 });
    const r = applyWorkoutResult(pet, 'easy', 'beginner', T0);
    expect(r.pet.hunger).toBe(100);
    expect(r.pet.happiness).toBe(100);
    expect(r.pet.energy).toBe(100);
  });
});

describe('clampAlarm', () => {
  it('accepts valid hour/minute', () => {
    expect(clampAlarm(7, 30)).toEqual({ hour: 7, minute: 30 });
    expect(clampAlarm(0, 0)).toEqual({ hour: 0, minute: 0 });
    expect(clampAlarm(23, 59)).toEqual({ hour: 23, minute: 59 });
  });

  it('rejects out-of-range values', () => {
    expect(clampAlarm(-1, 0)).toBeNull();
    expect(clampAlarm(24, 0)).toBeNull();
    expect(clampAlarm(12, -1)).toBeNull();
    expect(clampAlarm(12, 60)).toBeNull();
  });

  it('rejects NaN/Infinity', () => {
    expect(clampAlarm(NaN, 0)).toBeNull();
    expect(clampAlarm(0, NaN)).toBeNull();
    expect(clampAlarm(Infinity, 0)).toBeNull();
  });

  it('truncates fractional values', () => {
    expect(clampAlarm(7.5, 30.9)).toEqual({ hour: 7, minute: 30 });
  });
});

// --- store action coverage ---

vi.mock('../src/lib/audio', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/audio')>('../src/lib/audio');
  return { ...actual, beep: vi.fn() };
});

import { beep } from '../src/lib/audio';
const beepMock = beep as unknown as ReturnType<typeof vi.fn>;

describe('finishWorkout action', () => {
  beforeEach(() => { resetStore(); beepMock.mockClear(); });

  function startActive() {
    const pet = makePet({ xp: 0, streak: 0, lastWorkout: null });
    usePyxie.setState({
      pet,
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
    });
    return pet;
  }

  it('awards xp + streak=1 + lastWorkout + clears workoutActive when completed', () => {
    startActive();
    usePyxie.getState().finishWorkout(true);
    const s = usePyxie.getState();
    expect(s.ui.workoutActive).toBeNull();
    expect(s.ui.tab).toBe('pet');
    expect(s.pet?.xp).toBe(22);
    expect(s.pet?.streak).toBe(1);
    expect(s.pet?.lastWorkout).not.toBeNull();
    expect(s.history).toHaveLength(1);
    expect(s.history[0].xpGained).toBe(22);
  });

  it('sets evolved when xp crosses a stage boundary', () => {
    usePyxie.setState({
      pet: makePet({ xp: 50, stage: 0, lastWorkout: null }),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
    });
    usePyxie.getState().finishWorkout(true);
    const s = usePyxie.getState();
    expect(s.pet?.stage).toBe(1);
    expect(s.evolved).not.toBeNull();
  });

  it('pro-rates xp by workCompleted / workTotal when the user skipped work segments', () => {
    usePyxie.setState({
      pet: makePet({ xp: 0, lastWorkout: null }),
      // workTotal: 4, workCompleted: 1 → 25% multiplier on base xp 22 → 6
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout({ workCompleted: 1, workTotal: 4 }) },
    });
    usePyxie.getState().finishWorkout(true);
    const s = usePyxie.getState();
    expect(s.pet?.xp).toBe(6);
    expect(s.history[0].xpGained).toBe(6);
  });

  it('awards 0 xp when every work segment was skipped', () => {
    usePyxie.setState({
      pet: makePet({ xp: 10, lastWorkout: null }),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout({ workCompleted: 0, workTotal: 4 }) },
    });
    usePyxie.getState().finishWorkout(true);
    const s = usePyxie.getState();
    expect(s.pet?.xp).toBe(10);
    expect(s.history[0].xpGained).toBe(0);
  });

  it('does NOT award xp during the egg phase', () => {
    usePyxie.setState({
      pet: makePet({ xp: 0, workoutsToHatch: 3, lastWorkout: null }),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
    });
    usePyxie.getState().finishWorkout(true);
    const s = usePyxie.getState();
    expect(s.pet?.xp).toBe(0);
    expect(s.history[0].xpGained).toBe(0);
  });

  it('decrements workoutsToHatch on each completed workout', () => {
    usePyxie.setState({
      pet: makePet({ workoutsToHatch: 3 }),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
    });
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().pet?.workoutsToHatch).toBe(2);
  });

  it('hatches the egg on the workout that drops workoutsToHatch to 0', () => {
    // 8 baselines: ['ember','tide','verdant','gale','stone','umbra','aurora','static'].
    // floor(0.2 * 8) = 1 → tide.
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    usePyxie.setState({
      pet: makePet({ workoutsToHatch: 1, line: 'ember' }),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
    });
    usePyxie.getState().finishWorkout(true);
    const pet = usePyxie.getState().pet!;
    expect(pet.workoutsToHatch).toBe(0);
    expect(pet.line).toBe('tide');
    vi.restoreAllMocks();
  });

  it('distributes hatched baselines uniformly across all 8 lines', () => {
    const lines = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];
    const counts: Record<string, number> = Object.fromEntries(lines.map((l) => [l, 0]));
    const N = 1600;
    for (let i = 0; i < N; i++) {
      usePyxie.setState({
        pet: makePet({ workoutsToHatch: 1, line: 'ember' }),
        ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
      });
      usePyxie.getState().finishWorkout(true);
      counts[usePyxie.getState().pet!.line]++;
    }
    const expected = N / 8;
    const tol = expected * 0.35;
    for (const line of lines) {
      expect(counts[line], `${line} count too low`).toBeGreaterThan(expected - tol);
    }
  });

  it('tallies workoutCounts by intensity and complexity', () => {
    usePyxie.setState({
      pet: makePet({ workoutsToHatch: 0 }),
      ui: {
        ...usePyxie.getState().ui,
        workoutActive: makeActiveWorkout({ intensity: 'hard', complexity: 'advanced' }),
      },
    });
    usePyxie.getState().finishWorkout(true);
    const c = usePyxie.getState().pet!.workoutCounts;
    expect(c.intensity.hard).toBe(1);
    expect(c.complexity.advanced).toBe(1);
    expect(c.intensity.easy).toBe(0);
  });

  it('does NOT award xp/streak when completed=false (quit/abort)', () => {
    const before = startActive();
    usePyxie.getState().finishWorkout(false);
    const s = usePyxie.getState();
    expect(s.ui.workoutActive).toBeNull();
    expect(s.pet?.xp).toBe(before.xp);
    expect(s.pet?.streak).toBe(before.streak);
    expect(s.pet?.lastWorkout).toBeNull();
    expect(s.history).toHaveLength(0);
  });

  it('caps history at 30 entries (newest first)', () => {
    usePyxie.setState({
      pet: makePet({ lastWorkout: null }),
      history: makeHistory(30),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() },
    });
    usePyxie.getState().finishWorkout(true);
    const h = usePyxie.getState().history;
    expect(h).toHaveLength(30);
    expect(h[0].xpGained).toBe(22);
  });

  it('is a safe no-op when there is no active workout', () => {
    usePyxie.setState({ pet: makePet({ lastWorkout: null }) });
    expect(() => usePyxie.getState().finishWorkout(true)).not.toThrow();
    expect(usePyxie.getState().history).toHaveLength(0);
  });
});

describe('tickWorkout final-segment + beeps', () => {
  beforeEach(() => { resetStore(); beepMock.mockClear(); });

  it('finishes the workout when remaining<0 on the final segment', () => {
    usePyxie.setState({
      pet: makePet({ lastWorkout: null }),
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout({ segIdx: 4, remaining: 0 }) },
    });
    usePyxie.getState().tickWorkout();
    const s = usePyxie.getState();
    expect(s.ui.workoutActive).toBeNull();
    expect(s.pet?.xp).toBe(22);
  });

  it('beeps "tick" at remaining 3, 2, 1 only', () => {
    // segIdx 1 has dur 45; place segmentStartedAt so wall-clock elapsed yields `rem` seconds remaining.
    const now = Date.now();
    const tickFromRemaining = (rem: number) => {
      const dur = 45;
      const elapsedSec = dur - rem; // seconds elapsed into the segment
      usePyxie.setState((st) => ({
        ui: { ...st.ui, workoutActive: makeActiveWorkout({ segIdx: 1, remaining: rem + 1, segmentStartedAt: now - elapsedSec * 1000 }) },
      }));
      beepMock.mockClear();
      usePyxie.getState().tickWorkout();
      const calls = beepMock.mock.calls.filter((c) => c[0] === 'tick');
      return calls.length;
    };
    expect(tickFromRemaining(3)).toBe(1);
    expect(tickFromRemaining(2)).toBe(1);
    expect(tickFromRemaining(1)).toBe(1);
    expect(tickFromRemaining(4)).toBe(0);
    expect(tickFromRemaining(5)).toBe(0);
  });
});

describe('hydrate migration', () => {
  beforeEach(resetStore);

  it('is a no-op when nothing is persisted', () => {
    localStorage.removeItem('pyxie-state');
    const before = usePyxie.getState();
    usePyxie.getState().hydrate();
    const after = usePyxie.getState();
    expect(after.pet).toBe(before.pet);
    expect(after.history).toEqual([]);
  });

  it('fills missing settings keys from DEFAULT_SETTINGS', () => {
    localStorage.setItem('pyxie-state', JSON.stringify({
      pet: null,
      settings: { intensity: 'hard' },
      history: [],
      installNudgeDismissed: false,
      ui: { tab: 'pet' },
    }));
    usePyxie.getState().hydrate();
    const s = usePyxie.getState().settings;
    expect(s.intensity).toBe('hard');
    expect(s.complexity).toBe('beginner');
    expect(s.alarmHour).toBe(7);
    expect(s.soundOn).toBe(true);
  });

  it('defaults tab to "pet" when ui is missing', () => {
    localStorage.setItem('pyxie-state', JSON.stringify({ pet: null }));
    usePyxie.getState().hydrate();
    expect(usePyxie.getState().ui.tab).toBe('pet');
  });

  it('handles persisted pet=null without throwing', () => {
    localStorage.setItem('pyxie-state', JSON.stringify({ pet: null, history: [] }));
    expect(() => usePyxie.getState().hydrate()).not.toThrow();
    expect(usePyxie.getState().pet).toBeNull();
  });

  it('defaults history to [] when missing', () => {
    localStorage.setItem('pyxie-state', JSON.stringify({ pet: null }));
    usePyxie.getState().hydrate();
    expect(usePyxie.getState().history).toEqual([]);
  });

  it('migrates a v1 pet (no egg fields) to workoutsToHatch=0 + empty counts', () => {
    const legacyPet = {
      name: 'Legacy', line: 'tide', stage: 2,
      hunger: 80, happiness: 80, energy: 80,
      xp: 200, streak: 5, alive: true,
      born: T0, lastDecay: T0, lastWorkout: T0, criticalSince: null,
    };
    localStorage.setItem('pyxie-state', JSON.stringify({ pet: legacyPet, history: [] }));
    usePyxie.getState().hydrate();
    const p = usePyxie.getState().pet!;
    expect(p.workoutsToHatch).toBe(0);
    expect(p.workoutCounts.intensity.medium).toBe(0);
    expect(p.line).toBe('tide');
    expect(p.stage).toBe(2);
  });

  it('migrates a legacy pet onto the canonical primary spine via lineageId', () => {
    const legacyPet = {
      name: 'Legacy', line: 'ember', stage: 3,
      hunger: 80, happiness: 80, energy: 80,
      xp: 500, streak: 5, alive: true,
      born: T0, lastDecay: T0, lastWorkout: T0, criticalSince: null,
    };
    localStorage.setItem('pyxie-state', JSON.stringify({ pet: legacyPet, history: [] }));
    usePyxie.getState().hydrate();
    expect(usePyxie.getState().pet?.lineageId).toBe('ember-ppp');
  });

  it('falls back to the line baseline when a persisted lineageId is unknown', () => {
    const legacyPet = {
      name: 'Legacy', line: 'verdant', stage: 1,
      hunger: 80, happiness: 80, energy: 80,
      xp: 100, streak: 5, alive: true,
      born: T0, lastDecay: T0, lastWorkout: T0, criticalSince: null,
      workoutsToHatch: 0,
      workoutCounts: { intensity: { easy: 0, medium: 0, hard: 0 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
      lineageId: 'made-up-id',
    };
    localStorage.setItem('pyxie-state', JSON.stringify({ pet: legacyPet, history: [] }));
    usePyxie.getState().hydrate();
    expect(usePyxie.getState().pet?.lineageId).toBe('verdant-p');
  });
});

describe('resetPet', () => {
  beforeEach(resetStore);

  it('preserves settings + installNudgeDismissed; clears pet/history/evolved', () => {
    usePyxie.setState({
      pet: makePet(),
      history: makeHistory(3),
      installNudgeDismissed: true,
      evolved: { pet: makePet({ stage: 1 }), from: 0 },
      settings: { ...usePyxie.getState().settings, intensity: 'hard', soundOn: false, alarmEnabled: true },
    });
    usePyxie.getState().resetPet();
    const s = usePyxie.getState();
    expect(s.pet).toBeNull();
    expect(s.history).toEqual([]);
    expect(s.evolved).toBeNull();
    expect(s.installNudgeDismissed).toBe(true);
    expect(s.settings.intensity).toBe('hard');
    expect(s.settings.soundOn).toBe(false);
    expect(s.settings.alarmEnabled).toBe(true);
  });
});

describe('setAlarmTime validation', () => {
  beforeEach(resetStore);

  it('writes valid values', () => {
    usePyxie.getState().setAlarmTime(9, 15);
    const s = usePyxie.getState().settings;
    expect(s.alarmHour).toBe(9);
    expect(s.alarmMinute).toBe(15);
  });

  it('rejects out-of-range hour (no state change)', () => {
    const before = { ...usePyxie.getState().settings };
    usePyxie.getState().setAlarmTime(25, 0);
    expect(usePyxie.getState().settings).toEqual(before);
  });

  it('rejects out-of-range minute (no state change)', () => {
    const before = { ...usePyxie.getState().settings };
    usePyxie.getState().setAlarmTime(7, 60);
    expect(usePyxie.getState().settings).toEqual(before);
  });

  it('rejects NaN (no state change)', () => {
    const before = { ...usePyxie.getState().settings };
    usePyxie.getState().setAlarmTime(NaN, 0);
    expect(usePyxie.getState().settings).toEqual(before);
  });

  it('truncates fractional inputs', () => {
    usePyxie.getState().setAlarmTime(8.9, 14.6);
    const s = usePyxie.getState().settings;
    expect(s.alarmHour).toBe(8);
    expect(s.alarmMinute).toBe(14);
  });
});

afterEach(() => { beepMock.mockClear(); });
