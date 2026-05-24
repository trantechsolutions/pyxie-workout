import type { Pet, Settings, WorkoutHistory, Tab } from '../types';
import type { WorkoutEvent } from './familySyncSlice';
import { DEFAULT_SETTINGS, EMPTY_WORKOUT_COUNTS } from '../../data/constants';
import { loadPersisted, savePersisted } from '../../lib/storage';
import { EVOLUTION_TREE, legacyLineageId } from '../../data/evolutionTree';
import type { PyxieSlice } from './types';

// Bump whenever the persisted shape gains new top-level fields. The hydrate
// step initializes anything missing so legacy saves load cleanly.
export const PERSIST_VERSION = 2;

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
  version?: number;
  pet: Pet | null;
  settings: Settings;
  history: WorkoutHistory[];
  installNudgeDismissed: boolean;
  ui: { tab: Tab };
  eventQueue?: WorkoutEvent[];
}

// v2 migration: initialize eventQueue for users persisted before ADR-0007.
function migratePersisted(raw: Partial<Persisted>): Partial<Persisted> {
  const v = raw.version ?? 1;
  if (v >= PERSIST_VERSION) return raw;
  return { ...raw, eventQueue: raw.eventQueue ?? [], version: PERSIST_VERSION };
}

export interface PersistenceSlice {
  hydrate: () => void;
  persist: () => void;
}

export const createPersistenceSlice: PyxieSlice<PersistenceSlice> = (set, get) => ({
  hydrate: () => {
    const raw = loadPersisted() as Partial<Persisted> | null;
    if (!raw) return;
    const loaded = migratePersisted(raw);
    set((s) => ({
      pet: migratePet(loaded.pet),
      settings: { ...DEFAULT_SETTINGS, ...(loaded.settings ?? {}) },
      history: loaded.history ?? [],
      installNudgeDismissed: !!loaded.installNudgeDismissed,
      ui: { ...s.ui, tab: loaded.ui?.tab ?? 'pet' },
      eventQueue: Array.isArray(loaded.eventQueue) ? loaded.eventQueue : [],
    }));
  },

  persist: () => {
    const s = get();
    savePersisted({
      version: PERSIST_VERSION,
      pet: s.pet,
      settings: s.settings,
      history: s.history,
      installNudgeDismissed: s.installNudgeDismissed,
      ui: { tab: s.ui.tab },
      eventQueue: s.eventQueue,
    });
  },
});
