import type { Intensity, Complexity, ActiveWorkout, WorkoutHistory, Pet } from '../types';
import { pickExercises, buildSegments } from '../../lib/workout';
import { applyWorkoutResult } from '../../lib/progression';
import { beep } from '../../lib/audio';
import type { PyxieSlice } from './types';
import { HATCHABLE_BASELINES } from '../../data/lineRegistry';

// Tally the workout into the pet's running counts and, if the pet is still an
// egg, count this workout toward the hatch threshold. On hatch, a baseline
// line is rolled at random — blind-box, independent of the egg's visual color.
function applyEggAndCounts(pet: Pet, intensity: Intensity, complexity: Complexity): Pet {
  const next: Pet = {
    ...pet,
    workoutCounts: {
      intensity: {
        ...pet.workoutCounts.intensity,
        [intensity]: pet.workoutCounts.intensity[intensity] + 1,
      },
      complexity: {
        ...pet.workoutCounts.complexity,
        [complexity]: pet.workoutCounts.complexity[complexity] + 1,
      },
    },
  };
  if (next.workoutsToHatch > 0) {
    const remaining = next.workoutsToHatch - 1;
    next.workoutsToHatch = remaining;
    if (remaining === 0) {
      const hatchedLine = HATCHABLE_BASELINES[Math.floor(Math.random() * HATCHABLE_BASELINES.length)];
      next.line = hatchedLine;
      // Place the freshly hatched pet at the baseline tree node for its line.
      next.lineageId = hatchedLine;
    }
  }
  return next;
}

export interface WorkoutSlice {
  history: WorkoutHistory[];

  setIntensity: (i: Intensity) => void;
  setComplexity: (c: Complexity) => void;
  buildPreview: () => void;
  rerollPreview: () => void;

  startWorkout: () => void;
  tickWorkout: () => void;
  togglePause: () => void;
  skipSegment: () => void;
  finishWorkout: (completed: boolean) => void;
}

export const createWorkoutSlice: PyxieSlice<WorkoutSlice> = (set, get) => ({
  history: [],

  setIntensity: (intensity) => set((s) => ({
    settings: { ...s.settings, intensity },
    ui: { ...s.ui, previewList: null },
  })),
  setComplexity: (complexity) => set((s) => ({
    settings: { ...s.settings, complexity },
    ui: { ...s.ui, previewList: null },
  })),
  buildPreview: () => {
    const { ui, settings } = get();
    if (ui.previewList) return;
    set({ ui: { ...ui, previewList: pickExercises(settings.intensity, settings.complexity, 8) } });
  },
  rerollPreview: () => {
    const { settings } = get();
    set((s) => ({ ui: { ...s.ui, previewList: pickExercises(settings.intensity, settings.complexity, 8) } }));
  },

  startWorkout: () => {
    const { ui, settings } = get();
    const exList = ui.previewList ?? pickExercises(settings.intensity, settings.complexity, 8);
    const segments = buildSegments(exList);
    const now = Date.now();
    const workTotal = segments.filter((s) => s.kind === 'work').length;
    const active: ActiveWorkout = {
      segments,
      segIdx: 0,
      remaining: segments[0].dur,
      paused: false,
      startedAt: now,
      segmentStartedAt: now,
      pausedAt: null,
      workCompleted: 0,
      workTotal,
      exList,
      intensity: settings.intensity,
      complexity: settings.complexity,
    };
    set((s) => ({ ui: { ...s.ui, workoutActive: active } }));
  },

  tickWorkout: () => {
    const { ui, settings } = get();
    const w = ui.workoutActive;
    if (!w || w.paused) return;
    const now = Date.now();
    const seg = w.segments[w.segIdx];
    const elapsedSec = (now - w.segmentStartedAt) / 1000;
    if (elapsedSec >= seg.dur) {
      const segIdx = w.segIdx + 1;
      if (segIdx >= w.segments.length) {
        get().finishWorkout(true);
        return;
      }
      beep(w.segments[segIdx].kind, settings.soundOn);
      // Roll forward by the segment duration to absorb sub-second overflow without drift.
      const nextStartedAt = w.segmentStartedAt + seg.dur * 1000;
      const workCompleted = seg.kind === 'work' ? w.workCompleted + 1 : w.workCompleted;
      set({ ui: { ...ui, workoutActive: { ...w, segIdx, remaining: w.segments[segIdx].dur, segmentStartedAt: nextStartedAt, workCompleted } } });
      return;
    }
    const remaining = Math.max(0, Math.ceil(seg.dur - elapsedSec));
    if (remaining === w.remaining) return;
    if (remaining >= 1 && remaining <= 3) {
      beep('tick', settings.soundOn);
    }
    set({ ui: { ...ui, workoutActive: { ...w, remaining } } });
  },

  togglePause: () => set((s) => {
    const w = s.ui.workoutActive;
    if (!w) return s;
    const now = Date.now();
    if (w.paused) {
      // Resume: shift segmentStartedAt forward by the paused duration.
      const pausedFor = w.pausedAt != null ? now - w.pausedAt : 0;
      return { ui: { ...s.ui, workoutActive: { ...w, paused: false, pausedAt: null, segmentStartedAt: w.segmentStartedAt + pausedFor } } };
    }
    return { ui: { ...s.ui, workoutActive: { ...w, paused: true, pausedAt: now } } };
  }),

  skipSegment: () => {
    const { ui } = get();
    const w = ui.workoutActive;
    if (!w) return;
    const segIdx = w.segIdx + 1;
    if (segIdx >= w.segments.length) { get().finishWorkout(true); return; }
    set({ ui: { ...ui, workoutActive: { ...w, segIdx, remaining: w.segments[segIdx].dur, segmentStartedAt: Date.now(), pausedAt: w.paused ? Date.now() : null } } });
  },

  finishWorkout: (completed) => {
    const { ui, pet, history } = get();
    const w = ui.workoutActive;
    if (!w) {
      set((s) => ({ ui: { ...s.ui, workoutActive: null, previewList: null } }));
      return;
    }
    if (completed && pet && pet.alive) {
      const effort = w.workTotal > 0 ? w.workCompleted / w.workTotal : 1;
      // Eggs incubate via attendance, not XP — XP accrues only after hatch so the
      // user gets to see their stage-1 form before any evolution thresholds trigger.
      const mult = pet.workoutsToHatch > 0 ? 0 : effort;
      const result = applyWorkoutResult(pet, w.intensity, w.complexity, Date.now(), mult);
      const finalPet = applyEggAndCounts(result.pet, w.intensity, w.complexity);
      const newHistory: WorkoutHistory[] = [
        { date: result.pet.lastWorkout!, intensity: w.intensity, complexity: w.complexity, count: w.exList.length, xpGained: result.xpGained },
        ...history,
      ].slice(0, 30);
      set((s) => ({
        pet: finalPet,
        history: newHistory,
        evolved: result.evolved,
        ui: { ...s.ui, workoutActive: null, previewList: null, tab: 'pet' },
      }));
    } else {
      set((s) => ({ ui: { ...s.ui, workoutActive: null, previewList: null, tab: 'pet' } }));
    }
  },
});
