import { usePyxie } from '../src/store/usePyxie';
import { DEFAULT_SETTINGS, DEFAULT_UI } from '../src/data/constants';
import type { Pet, Line, ActiveWorkout, WorkoutHistory } from '../src/store/types';

const T0 = 1_700_000_000_000;

export function resetStore() {
  usePyxie.setState({
    pet: null,
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    installNudgeDismissed: false,
    ui: { ...DEFAULT_UI },
    deferredPrompt: null,
    evolved: null,
    petHydrating: false,
  });
  localStorage.clear();
}

export function makePet(over: Partial<Pet> = {}): Pet {
  return {
    name: 'Testy',
    line: 'ember' as Line,
    stage: 0,
    hunger: 80, happiness: 90, energy: 80,
    xp: 0, streak: 0, alive: true,
    born: T0, lastDecay: T0, lastWorkout: null, criticalSince: null,
    workoutsToHatch: 0,
    workoutCounts: {
      intensity:  { easy: 0, medium: 0, hard: 0 },
      complexity: { beginner: 0, intermediate: 0, advanced: 0 },
    },
    lineageId: 'ember',
    ...over,
  };
}

export function makeActiveWorkout(over: Partial<ActiveWorkout> = {}): ActiveWorkout {
  return {
    segments: [
      { kind: 'warmup',   dur: 60, label: 'Warm up' },
      { kind: 'work',     dur: 45, label: 'Push-ups',  cue: 'Chest leads.', idx: 1 },
      { kind: 'rest',     dur: 15, label: 'Rest',      next: 'Squats' },
      { kind: 'work',     dur: 45, label: 'Squats',    cue: 'Sit back.',    idx: 2 },
      { kind: 'cooldown', dur: 60, label: 'Cool down' },
    ],
    segIdx: 1,
    remaining: 30,
    paused: false,
    startedAt: T0,
    segmentStartedAt: T0,
    pausedAt: null,
    workCompleted: 2,
    workTotal: 2,
    exList: [
      { name: 'Push-ups', cue: 'Chest leads.' },
      { name: 'Squats',   cue: 'Sit back.' },
    ],
    intensity: 'medium',
    complexity: 'beginner',
    ...over,
  };
}

export function makeHistory(count: number): WorkoutHistory[] {
  return Array.from({ length: count }, (_, i) => ({
    date: T0 + i * 86_400_000,
    intensity: 'medium' as const,
    complexity: 'beginner' as const,
    count: 8,
    xpGained: 22,
  }));
}
