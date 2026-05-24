import type { Settings, SessionUI, PersistedUI, WorkoutCounts } from '../store/types';

// Number of completed workouts required to hatch a freshly placed egg.
export const HATCH_WORKOUTS = 3;

export const EMPTY_WORKOUT_COUNTS: WorkoutCounts = {
  intensity:  { easy: 0, medium: 0, hard: 0 },
  complexity: { beginner: 0, intermediate: 0, advanced: 0 },
};

export const XP_THRESHOLDS = [0, 60, 180, 420, 900];

// Streak multiplier: +5% per consecutive day, capping at 2.0× on day 21.
// Tuned so a 30-day daily run averages ~1.65× — earnable but meaningful.
export const STREAK_MULT_STEP = 0.05;
export const STREAK_MULT_CAP_DAYS = 20; // 1 + 20 * 0.05 = 2.0
export const STREAK_MULT_MAX = 1 + STREAK_MULT_CAP_DAYS * STREAK_MULT_STEP;

export const MOODS = {
  great:   ['Feeling unstoppable!', 'Ready for anything', 'Glowing with energy', 'On top of the world'],
  ok:      ['Doing fine', 'A bit restless', 'Keeping up', 'Just hanging out'],
  hungry:  ['Tummy rumbling…', 'A little peckish', 'Need a snack soon'],
  sad:     ['Feeling lonely…', 'Could use some attention', 'A little down today'],
  tired:   ['Getting sleepy…', 'Energy low', 'Heavy eyelids'],
  weak:    ['Barely hanging on…', 'Needs you', 'Critical condition'],
} as const;

export const DEFAULT_SETTINGS: Settings = {
  intensity: 'medium',
  complexity: 'beginner',
  alarmEnabled: false,
  alarmHour: 7,
  alarmMinute: 0,
  soundOn: true,
  showExerciseGuide: true,
  familyFeaturesEnabled: false,
};

export const DEFAULT_SESSION_UI: SessionUI = {
  starterPick: null,
  starterName: null,
  previewList: null,
  workoutActive: null,
  lastAlarmFired: null,
};

export const DEFAULT_PERSISTED_UI: PersistedUI = {
  tab: 'pet',
};

// Combined default for callers that need a full UIState shape.
export const DEFAULT_UI = { ...DEFAULT_SESSION_UI, ...DEFAULT_PERSISTED_UI };
