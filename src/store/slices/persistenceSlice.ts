import type { Pet, Settings, WorkoutHistory, Tab } from '../types';
import { DEFAULT_SETTINGS, EMPTY_WORKOUT_COUNTS } from '../../data/constants';
import { loadPersisted, savePersisted } from '../../lib/storage';
import { EVOLUTION_TREE, legacyLineageId } from '../../data/evolutionTree';
import type { PyxieSlice } from './types';

// Existing v1/v2 saves predate egg + lineage fields. Default missing fields so
// legacy pets slot onto the canonical "all-primary" spine of the new tree.
function migratePet(pet: Pet | null | undefined): Pet | null {
  if (!pet) return null;
  const workoutsToHatch = pet.workoutsToHatch ?? 0;
  let lineageId = pet.lineageId ?? '';
  if (workoutsToHatch === 0) {
    // Hatched pets must have a valid tree node; synthesize from (line, stage) if absent or unknown.
    if (!lineageId || !EVOLUTION_TREE[lineageId]) {
      lineageId = legacyLineageId(pet.line, pet.stage);
    }
  }
  const migrated: Pet = {
    ...pet,
    workoutsToHatch,
    workoutCounts: pet.workoutCounts ?? {
      intensity:  { ...EMPTY_WORKOUT_COUNTS.intensity },
      complexity: { ...EMPTY_WORKOUT_COUNTS.complexity },
    },
    lineageId,
  };
  return migrated;
}

interface Persisted {
  pet: Pet | null;
  settings: Settings;
  history: WorkoutHistory[];
  installNudgeDismissed: boolean;
  ui: { tab: Tab };
}

export interface PersistenceSlice {
  hydrate: () => void;
  persist: () => void;
}

export const createPersistenceSlice: PyxieSlice<PersistenceSlice> = (set, get) => ({
  hydrate: () => {
    const loaded = loadPersisted() as Partial<Persisted> | null;
    if (!loaded) return;
    set((s) => ({
      pet: migratePet(loaded.pet),
      settings: { ...DEFAULT_SETTINGS, ...(loaded.settings ?? {}) },
      history: loaded.history ?? [],
      installNudgeDismissed: !!loaded.installNudgeDismissed,
      ui: { ...s.ui, tab: loaded.ui?.tab ?? 'pet' },
    }));
  },

  persist: () => {
    const s = get();
    savePersisted({
      pet: s.pet,
      settings: s.settings,
      history: s.history,
      installNudgeDismissed: s.installNudgeDismissed,
      ui: { tab: s.ui.tab },
    });
  },
});
