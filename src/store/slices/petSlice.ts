import type { Pet, Line } from '../types';
import { applyDecay } from '../../lib/decay';
import { HATCH_WORKOUTS, EMPTY_WORKOUT_COUNTS } from '../../data/constants';
import type { PyxieSlice } from './types';

const EGG_COLORS: Line[] = ['ember', 'tide', 'verdant'];

function randomEggColor(): Line {
  return EGG_COLORS[Math.floor(Math.random() * EGG_COLORS.length)];
}

export interface PetSlice {
  pet: Pet | null;
  evolved: { pet: Pet; from: number } | null;

  decayTick: () => void;
  setStarterPick: (line: Line | null) => void;
  setStarterName: (name: string) => void;
  placeEgg: () => void;
  /** @deprecated Use placeEgg(). Retained as an alias for legacy callers and tests. */
  hatch: () => void;
  tapPet: () => void;
  play: () => void;
  resetPet: () => void;
  acknowledgeEvolution: () => void;
}

export const createPetSlice: PyxieSlice<PetSlice> = (set, get) => ({
  pet: null,
  evolved: null,

  decayTick: () => {
    const { pet } = get();
    if (!pet) return;
    const next = applyDecay(pet);
    if (next !== pet) set({ pet: next });
  },

  setStarterPick: (line) => set((s) => ({ ui: { ...s.ui, starterPick: line } })),
  setStarterName: (name) => set((s) => ({ ui: { ...s.ui, starterName: name } })),

  placeEgg: () => {
    const { ui } = get();
    const eggColor = randomEggColor();
    const name = (ui.starterName ?? '').trim() || 'Egg';
    const now = Date.now();
    set({
      pet: {
        name,
        // Pre-hatch: line acts as the egg's visual flavor (blind-box random).
        // After hatch, the same line field carries the revealed baseline.
        line: eggColor,
        stage: 0,
        hunger: 80, happiness: 90, energy: 80,
        xp: 0, streak: 0, alive: true,
        born: now, lastDecay: now, lastWorkout: null, criticalSince: null,
        workoutsToHatch: HATCH_WORKOUTS,
        workoutCounts: {
          intensity:  { ...EMPTY_WORKOUT_COUNTS.intensity },
          complexity: { ...EMPTY_WORKOUT_COUNTS.complexity },
        },
        // Empty until hatch — egg has no tree node yet.
        lineageId: '',
      },
      ui: { ...ui, starterPick: null, starterName: null, tab: 'pet' },
    });
  },

  hatch: () => { get().placeEgg(); },

  tapPet: () => set((s) => s.pet
    ? { pet: { ...s.pet, happiness: Math.min(100, s.pet.happiness + 2) } }
    : s),

  play: () => set((s) => s.pet ? {
    pet: {
      ...s.pet,
      happiness: Math.min(100, s.pet.happiness + 12),
      energy: Math.max(0, s.pet.energy - 4),
    }
  } : s),

  resetPet: () => set((s) => ({
    pet: null,
    history: [],
    evolved: null,
    ui: { ...s.ui, starterPick: null, starterName: null, previewList: null, workoutActive: null },
  })),

  acknowledgeEvolution: () => set({ evolved: null }),
});
