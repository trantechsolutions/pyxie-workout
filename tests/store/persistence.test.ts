import { describe, it, expect, beforeEach } from 'vitest';
import { usePyxie } from '../../src/store/usePyxie';
import { PERSIST_VERSION } from '../../src/store/slices/persistenceSlice';
import { DEFAULT_SETTINGS, DEFAULT_UI } from '../../src/data/constants';
import type { Pet } from '../../src/store/types';

const KEY = 'pyxie-state';

function makeV1Pet(): Pet {
  return {
    name: 'Legacy',
    line: 'tide',
    stage: 1,
    hunger: 70, happiness: 80, energy: 60,
    xp: 25, streak: 3, alive: true,
    born: 1_700_000_000_000,
    lastDecay: 1_700_000_000_000,
    lastWorkout: 1_700_000_500_000,
    criticalSince: null,
    workoutsToHatch: 0,
    workoutCounts: {
      intensity:  { easy: 1, medium: 2, hard: 0 },
      complexity: { beginner: 2, intermediate: 1, advanced: 0 },
    },
    lineageId: 'tide',
  };
}

function resetStore() {
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

describe('persist v1 -> v2 migration', () => {
  beforeEach(resetStore);

  it('initializes eventQueue to [] when loading a v1 blob without one', () => {
    const v1Blob = {
      version: 1,
      pet: makeV1Pet(),
      settings: { ...DEFAULT_SETTINGS },
      history: [
        { date: 1_700_000_000_000, intensity: 'medium', complexity: 'beginner', count: 8, xpGained: 22 },
      ],
      installNudgeDismissed: true,
      ui: { tab: 'pet' },
      // NOTE: no eventQueue field — that's the whole point of the v1 case.
    };
    localStorage.setItem(KEY, JSON.stringify(v1Blob));

    usePyxie.getState().hydrate();

    expect(usePyxie.getState().eventQueue).toEqual([]);
  });

  it('does NOT lose pet/history/settings on v1 -> v2 hydrate', () => {
    const v1Pet = makeV1Pet();
    const v1Settings = { ...DEFAULT_SETTINGS, soundOn: false, intensity: 'hard' as const };
    const v1History = [
      { date: 1_700_000_000_000, intensity: 'easy' as const, complexity: 'beginner' as const, count: 6, xpGained: 12 },
      { date: 1_700_086_400_000, intensity: 'hard' as const, complexity: 'advanced' as const, count: 8, xpGained: 33 },
    ];
    localStorage.setItem(KEY, JSON.stringify({
      version: 1,
      pet: v1Pet,
      settings: v1Settings,
      history: v1History,
      installNudgeDismissed: true,
      ui: { tab: 'pet' },
    }));

    usePyxie.getState().hydrate();

    const s = usePyxie.getState();
    expect(s.pet?.name).toBe('Legacy');
    expect(s.pet?.xp).toBe(25);
    expect(s.pet?.lineageId).toBe('tide');
    expect(s.history).toEqual(v1History);
    expect(s.settings.soundOn).toBe(false);
    expect(s.settings.intensity).toBe('hard');
    expect(s.installNudgeDismissed).toBe(true);
  });

  it('handles a v1 blob with no version field (defaults to v1)', () => {
    localStorage.setItem(KEY, JSON.stringify({
      // version omitted entirely
      pet: makeV1Pet(),
      settings: { ...DEFAULT_SETTINGS },
      history: [],
      installNudgeDismissed: false,
      ui: { tab: 'pet' },
    }));

    usePyxie.getState().hydrate();
    expect(usePyxie.getState().eventQueue).toEqual([]);
    expect(usePyxie.getState().pet?.name).toBe('Legacy');
  });

  it('preserves an existing eventQueue when hydrating a v2 blob', () => {
    const queue = [{
      id: 'evt-1',
      completed_at: 1_700_000_000_000,
      intensity: 'medium' as const,
      complexity: 'beginner' as const,
      xp_gained: 22,
    }];
    localStorage.setItem(KEY, JSON.stringify({
      version: PERSIST_VERSION,
      pet: makeV1Pet(),
      settings: { ...DEFAULT_SETTINGS },
      history: [],
      installNudgeDismissed: false,
      ui: { tab: 'pet' },
      eventQueue: queue,
    }));

    usePyxie.getState().hydrate();
    expect(usePyxie.getState().eventQueue).toEqual(queue);
  });

  it('coerces a malformed eventQueue (non-array) to []', () => {
    localStorage.setItem(KEY, JSON.stringify({
      version: PERSIST_VERSION,
      pet: makeV1Pet(),
      settings: { ...DEFAULT_SETTINGS },
      history: [],
      installNudgeDismissed: false,
      ui: { tab: 'pet' },
      eventQueue: 'corrupt',
    }));

    usePyxie.getState().hydrate();
    expect(usePyxie.getState().eventQueue).toEqual([]);
  });

  it('persist() writes the current PERSIST_VERSION', () => {
    usePyxie.setState({ pet: makeV1Pet() });
    usePyxie.getState().persist();
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(PERSIST_VERSION);
    expect(Array.isArray(parsed.eventQueue)).toBe(true);
  });
});
