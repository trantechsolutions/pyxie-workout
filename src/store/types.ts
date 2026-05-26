export type Line = 'ember' | 'tide' | 'verdant' | 'gale' | 'stone' | 'umbra' | 'aurora' | 'static';
export type Intensity = 'easy' | 'medium' | 'hard';
export type Complexity = 'beginner' | 'intermediate' | 'advanced';
export type Tab = 'pet' | 'workout' | 'settings' | 'family';
export type SegmentKind = 'warmup' | 'work' | 'rest' | 'cooldown';
export type BeepKind = SegmentKind | 'tick' | 'alarm' | 'evolution';

export interface WorkoutCounts {
  intensity: Record<Intensity, number>;
  complexity: Record<Complexity, number>;
}

export interface Pet {
  name: string;
  line: Line;
  stage: number;
  hunger: number;
  happiness: number;
  energy: number;
  xp: number;
  streak: number;
  alive: boolean;
  born: number;
  lastDecay: number;
  lastWorkout: number | null;
  criticalSince: number | null;
  // Egg state: workouts remaining before the egg hatches. Becomes 0 on hatch.
  workoutsToHatch: number;
  // Tally of workouts completed under each profile; drives branching evolution (ADR-0003).
  workoutCounts: WorkoutCounts;
  // Current node id in EVOLUTION_TREE. Empty string while in egg phase, populated on hatch.
  lineageId: string;
}

export interface Settings {
  intensity: Intensity;
  complexity: Complexity;
  alarmEnabled: boolean;
  alarmHour: number;
  alarmMinute: number;
  soundOn: boolean;
  showExerciseGuide: boolean;
}

export interface Exercise {
  name: string;
  cue: string;
  form: string;
  // Per-exercise animation id (kebab-case derived from name). Resolves 1:1 to a
  // component in src/components/animations via getAnimationComponent.
  animationId: string;
}

export interface Segment {
  kind: SegmentKind;
  dur: number;
  label: string;
  cue?: string;
  form?: string;
  animationId?: string;
  idx?: number;
  next?: string;
}

export interface ActiveWorkout {
  segments: Segment[];
  segIdx: number;
  // Derived/cached display value (whole seconds). Source of truth is segmentStartedAt + wall clock.
  remaining: number;
  paused: boolean;
  startedAt: number;
  // Wall-clock ms when the current segment began. Adjusted on resume to absorb pause duration.
  segmentStartedAt: number;
  // Wall-clock ms when pause began, or null if running.
  pausedAt: number | null;
  // Work segments the user completed by letting the timer run out (not skipped).
  workCompleted: number;
  // Total work segments in this workout, fixed at start.
  workTotal: number;
  exList: Exercise[];
  intensity: Intensity;
  complexity: Complexity;
}

export interface WorkoutHistory {
  date: number;
  intensity: Intensity;
  complexity: Complexity;
  count: number;
  xpGained: number;
}

// Session-only UI state — never persisted. Cleared on reload.
export interface SessionUI {
  // Legacy starter selection state. Now only `starterName` is used by the egg-naming input;
  // `starterPick` is retained for back-compat with any cached UI but is no longer driven.
  starterPick: Line | null;
  starterName: string | null;
  previewList: Exercise[] | null;
  workoutActive: ActiveWorkout | null;
  lastAlarmFired: string | null;
}

// Persisted UI state — survives reload. Keep this lean.
export interface PersistedUI {
  tab: Tab;
}

// Combined view exposed to components.
export type UIState = SessionUI & PersistedUI;
