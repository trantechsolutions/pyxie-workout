import { create } from 'zustand';
import type { Pet } from './types';
import { XP_THRESHOLDS } from '../data/constants';
import { createPetSlice, type PetSlice } from './slices/petSlice';
import { createWorkoutSlice, type WorkoutSlice } from './slices/workoutSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { createInstallSlice, type InstallSlice } from './slices/installSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createPersistenceSlice, type PersistenceSlice } from './slices/persistenceSlice';
import { createFamilySyncSlice, type FamilySyncSlice } from './slices/familySyncSlice';

export type PyxieStore =
  & PetSlice
  & WorkoutSlice
  & SettingsSlice
  & InstallSlice
  & UISlice
  & PersistenceSlice
  & FamilySyncSlice;

export const usePyxie = create<PyxieStore>((...a) => ({
  ...createPetSlice(...a),
  ...createWorkoutSlice(...a),
  ...createSettingsSlice(...a),
  ...createInstallSlice(...a),
  ...createUISlice(...a),
  ...createPersistenceSlice(...a),
  ...createFamilySyncSlice(...a),
}));

// Auto-persist: subscribe to state changes and flush the persisted slice on
// any change. Trailing-edge debounce keeps high-frequency mutators (e.g. the
// 1Hz workout tick) from paying a localStorage write per change.
const PERSISTED_KEYS: ReadonlyArray<keyof PyxieStore> = [
  'pet', 'settings', 'history', 'installNudgeDismissed', 'eventQueue',
];
const PERSIST_DEBOUNCE_MS = 250;
let lastSnapshot: string | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

export function flushPersist(): void {
  if (pendingTimer != null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  usePyxie.getState().persist();
}

usePyxie.subscribe((state) => {
  const snap = JSON.stringify({
    ...Object.fromEntries(PERSISTED_KEYS.map((k) => [k, state[k]])),
    tab: state.ui.tab,
  });
  if (snap === lastSnapshot) return;
  lastSnapshot = snap;
  if (pendingTimer != null) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    usePyxie.getState().persist();
  }, PERSIST_DEBOUNCE_MS);
});

export function selectXpToNext(pet: Pet): number {
  const threshold = XP_THRESHOLDS[pet.stage + 1];
  return threshold === undefined ? 0 : Math.max(0, threshold - pet.xp);
}

export function selectIsFinalForm(pet: Pet): boolean {
  return XP_THRESHOLDS[pet.stage + 1] === undefined;
}
