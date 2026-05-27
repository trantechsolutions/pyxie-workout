import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePyxie } from '../src/store/usePyxie';
import { DEFAULT_SETTINGS } from '../src/data/constants';
import { resetStore, makePet, makeActiveWorkout, makeHistory } from './helpers';

// ---------------------------------------------------------------------------
// petSlice
// ---------------------------------------------------------------------------
describe('petSlice — placeEgg (blind-box)', () => {
  beforeEach(resetStore);
  afterEach(() => { vi.restoreAllMocks(); });

  it('creates a pet in the egg state with workoutsToHatch > 0', () => {
    usePyxie.getState().placeEgg();
    const { pet, ui } = usePyxie.getState();
    expect(pet).not.toBeNull();
    expect(pet?.alive).toBe(true);
    expect(pet?.stage).toBe(0);
    expect(pet?.workoutsToHatch).toBeGreaterThan(0);
    expect(ui.tab).toBe('pet');
    expect(ui.starterName).toBeNull();
  });

  it('rolls a random egg color from the three baselines', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // index 0 → ember
    usePyxie.getState().placeEgg();
    expect(usePyxie.getState().pet?.line).toBe('ember');
  });

  it('uses the trimmed custom name', () => {
    usePyxie.getState().setStarterName('  Yolk  ');
    usePyxie.getState().placeEgg();
    expect(usePyxie.getState().pet?.name).toBe('Yolk');
  });

  it('falls back to "Egg" when no name is provided', () => {
    usePyxie.getState().placeEgg();
    expect(usePyxie.getState().pet?.name).toBe('Egg');
  });

  it('initializes workoutCounts to zero', () => {
    usePyxie.getState().placeEgg();
    const counts = usePyxie.getState().pet?.workoutCounts;
    expect(counts?.intensity).toEqual({ easy: 0, medium: 0, hard: 0 });
    expect(counts?.complexity).toEqual({ beginner: 0, intermediate: 0, advanced: 0 });
  });

  it('hatch() is an alias for placeEgg()', () => {
    usePyxie.getState().hatch();
    expect(usePyxie.getState().pet?.workoutsToHatch).toBeGreaterThan(0);
  });

  it('distributes egg colors across {ember, tide, verdant} over many trials', () => {
    const counts: Record<string, number> = { ember: 0, tide: 0, verdant: 0 };
    const N = 1500;
    for (let i = 0; i < N; i++) {
      resetStore();
      usePyxie.getState().placeEgg();
      const line = usePyxie.getState().pet!.line;
      counts[line]++;
    }
    // Each bucket should land within ±25% of the expected N/3 (~500). Generous bound
    // keeps the test stable while still failing if a bucket is structurally missed.
    const expected = N / 3;
    const tolerance = expected * 0.25;
    expect(counts.ember).toBeGreaterThan(expected - tolerance);
    expect(counts.tide).toBeGreaterThan(expected - tolerance);
    expect(counts.verdant).toBeGreaterThan(expected - tolerance);
  });
});

describe('petSlice — interactions', () => {
  beforeEach(resetStore);

  it('tapPet is a no-op when there is no pet', () => {
    expect(() => usePyxie.getState().tapPet()).not.toThrow();
    expect(usePyxie.getState().pet).toBeNull();
  });

  it('tapPet bumps happiness by 2, clamped to 100', () => {
    usePyxie.setState({ pet: makePet({ happiness: 50 }) });
    usePyxie.getState().tapPet();
    expect(usePyxie.getState().pet?.happiness).toBe(52);
    usePyxie.setState({ pet: makePet({ happiness: 99 }) });
    usePyxie.getState().tapPet();
    expect(usePyxie.getState().pet?.happiness).toBe(100);
  });

  it('play raises happiness +12 and drops energy -4 (clamped)', () => {
    usePyxie.setState({ pet: makePet({ happiness: 50, energy: 50 }) });
    usePyxie.getState().play();
    expect(usePyxie.getState().pet?.happiness).toBe(62);
    expect(usePyxie.getState().pet?.energy).toBe(46);

    usePyxie.setState({ pet: makePet({ happiness: 95, energy: 2 }) });
    usePyxie.getState().play();
    expect(usePyxie.getState().pet?.happiness).toBe(100);
    expect(usePyxie.getState().pet?.energy).toBe(0);
  });

  it('play is a no-op when no pet exists', () => {
    expect(() => usePyxie.getState().play()).not.toThrow();
  });

  it('resetPet clears pet, history, evolved, and session UI', () => {
    usePyxie.setState({
      pet: makePet(),
      history: makeHistory(3),
      evolved: { pet: makePet({ stage: 2 }), from: 1 },
      ui: { ...usePyxie.getState().ui, starterPick: 'tide', starterName: 'X', previewList: [], workoutActive: makeActiveWorkout() },
    });
    usePyxie.getState().resetPet();
    const s = usePyxie.getState();
    expect(s.pet).toBeNull();
    expect(s.history).toEqual([]);
    expect(s.evolved).toBeNull();
    expect(s.ui.starterPick).toBeNull();
    expect(s.ui.starterName).toBeNull();
    expect(s.ui.previewList).toBeNull();
    expect(s.ui.workoutActive).toBeNull();
  });

  it('acknowledgeEvolution clears the evolved banner', () => {
    usePyxie.setState({ evolved: { pet: makePet({ stage: 1 }), from: 0 } });
    usePyxie.getState().acknowledgeEvolution();
    expect(usePyxie.getState().evolved).toBeNull();
  });

  it('decayTick is a no-op when there is no pet', () => {
    expect(() => usePyxie.getState().decayTick()).not.toThrow();
  });

  it('decayTick leaves the reference unchanged when <30min elapsed', () => {
    const pet = makePet({ lastDecay: Date.now() });
    usePyxie.setState({ pet });
    usePyxie.getState().decayTick();
    expect(usePyxie.getState().pet).toBe(pet);
  });

  it('decayTick writes a new pet object when decay applies', () => {
    const pet = makePet({ lastDecay: Date.now() - 1000 * 60 * 60 * 4, hunger: 90 });
    usePyxie.setState({ pet });
    usePyxie.getState().decayTick();
    const next = usePyxie.getState().pet!;
    expect(next).not.toBe(pet);
    expect(next.hunger).toBeLessThan(90);
  });
});

// ---------------------------------------------------------------------------
// workoutSlice
// ---------------------------------------------------------------------------
describe('workoutSlice — preview + intensity/complexity', () => {
  beforeEach(resetStore);

  it('setIntensity stores choice and resets previewList', () => {
    usePyxie.setState((s) => ({ ui: { ...s.ui, previewList: [{ name: 'x', cue: 'y', form: 'test form', animationId: 'push-ups' as const }] } }));
    usePyxie.getState().setIntensity('hard');
    expect(usePyxie.getState().settings.intensity).toBe('hard');
    expect(usePyxie.getState().ui.previewList).toBeNull();
  });

  it('setComplexity stores choice and resets previewList', () => {
    usePyxie.setState((s) => ({ ui: { ...s.ui, previewList: [{ name: 'x', cue: 'y', form: 'test form', animationId: 'push-ups' as const }] } }));
    usePyxie.getState().setComplexity('advanced');
    expect(usePyxie.getState().settings.complexity).toBe('advanced');
    expect(usePyxie.getState().ui.previewList).toBeNull();
  });

  it('buildPreview populates an 8-exercise list', () => {
    usePyxie.getState().buildPreview();
    expect(usePyxie.getState().ui.previewList).toHaveLength(8);
  });

  it('buildPreview is a no-op when previewList already exists', () => {
    const list = [{ name: 'x', cue: 'y', form: 'test form', animationId: 'push-ups' as const }];
    usePyxie.setState((s) => ({ ui: { ...s.ui, previewList: list } }));
    usePyxie.getState().buildPreview();
    expect(usePyxie.getState().ui.previewList).toBe(list);
  });

  it('rerollPreview always rewrites the list', () => {
    const stale = [{ name: 'x', cue: 'y', form: 'test form', animationId: 'push-ups' as const }];
    usePyxie.setState((s) => ({ ui: { ...s.ui, previewList: stale } }));
    usePyxie.getState().rerollPreview();
    expect(usePyxie.getState().ui.previewList).toHaveLength(8);
    expect(usePyxie.getState().ui.previewList).not.toBe(stale);
  });
});

describe('workoutSlice — start/skip/finish', () => {
  beforeEach(resetStore);

  it('startWorkout builds segments from the preview when present', () => {
    const preview = [
      { name: 'Push-ups', cue: 'a', form: 'test form', animationId: 'push-ups' as const },
      { name: 'Squats', cue: 'b', form: 'test form', animationId: 'push-ups' as const },
    ];
    usePyxie.setState((s) => ({ ui: { ...s.ui, previewList: preview } }));
    usePyxie.getState().startWorkout();
    const w = usePyxie.getState().ui.workoutActive!;
    expect(w.segIdx).toBe(0);
    expect(w.paused).toBe(false);
    expect(w.exList).toBe(preview);
    expect(w.segments.length).toBeGreaterThan(0);
    expect(w.remaining).toBe(w.segments[0].dur);
  });

  it('startWorkout falls back to picking 8 fresh exercises when no preview', () => {
    usePyxie.getState().startWorkout();
    const w = usePyxie.getState().ui.workoutActive!;
    expect(w.exList).toHaveLength(8);
  });

  it('togglePause flips the paused flag', () => {
    usePyxie.setState((s) => ({ ui: { ...s.ui, workoutActive: makeActiveWorkout() } }));
    usePyxie.getState().togglePause();
    expect(usePyxie.getState().ui.workoutActive?.paused).toBe(true);
    usePyxie.getState().togglePause();
    expect(usePyxie.getState().ui.workoutActive?.paused).toBe(false);
  });

  it('togglePause is a no-op when no workout is active', () => {
    usePyxie.getState().togglePause();
    expect(usePyxie.getState().ui.workoutActive).toBeNull();
  });

  it('skipSegment is a no-op when no workout is active', () => {
    expect(() => usePyxie.getState().skipSegment()).not.toThrow();
  });

  it('skipSegment advances segIdx and resets remaining', () => {
    usePyxie.setState((s) => ({ ui: { ...s.ui, workoutActive: makeActiveWorkout({ segIdx: 1, remaining: 30 }) } }));
    usePyxie.getState().skipSegment();
    const w = usePyxie.getState().ui.workoutActive!;
    expect(w.segIdx).toBe(2);
    expect(w.remaining).toBe(w.segments[2].dur);
  });

  it('skipSegment past the final segment finishes the workout', () => {
    usePyxie.setState({ pet: makePet() });
    usePyxie.setState((s) => ({ ui: { ...s.ui, workoutActive: makeActiveWorkout({ segIdx: 4, remaining: 5 }) } }));
    usePyxie.getState().skipSegment();
    expect(usePyxie.getState().ui.workoutActive).toBeNull();
  });

  it('finishWorkout(false) clears workout state and previewList without rewarding xp', () => {
    const pet = makePet({ xp: 10 });
    usePyxie.setState({
      pet,
      ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout(), previewList: [{ name: 'x', cue: 'y', form: 'test form', animationId: 'push-ups' as const }] },
    });
    usePyxie.getState().finishWorkout(false);
    const s = usePyxie.getState();
    expect(s.ui.workoutActive).toBeNull();
    expect(s.ui.previewList).toBeNull();
    expect(s.ui.tab).toBe('pet');
    expect(s.pet?.xp).toBe(10);
  });

  it('finishWorkout(true) without an active workout is a safe no-op', () => {
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().ui.workoutActive).toBeNull();
  });

  it('finishWorkout(true) with no pet still clears state', () => {
    usePyxie.setState((s) => ({ ui: { ...s.ui, workoutActive: makeActiveWorkout() } }));
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().ui.workoutActive).toBeNull();
  });

  it('finishWorkout(true) with a dead pet does not award xp', () => {
    usePyxie.setState((s) => ({
      pet: makePet({ alive: false, xp: 5 }),
      ui: { ...s.ui, workoutActive: makeActiveWorkout() },
    }));
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().pet?.xp).toBe(5);
  });

  it('finishWorkout(true) on a live pet writes history and bumps xp', () => {
    usePyxie.setState((s) => ({
      pet: makePet({ xp: 0 }),
      ui: { ...s.ui, workoutActive: makeActiveWorkout() },
    }));
    usePyxie.getState().finishWorkout(true);
    const s = usePyxie.getState();
    expect(s.pet?.xp).toBeGreaterThan(0);
    expect(s.history.length).toBe(1);
    expect(s.history[0].intensity).toBe('medium');
    expect(s.history[0].complexity).toBe('beginner');
    expect(s.ui.tab).toBe('pet');
  });

  it('finishWorkout(true) caps history at 30 entries', () => {
    usePyxie.setState((s) => ({
      pet: makePet(),
      history: makeHistory(30),
      ui: { ...s.ui, workoutActive: makeActiveWorkout() },
    }));
    usePyxie.getState().finishWorkout(true);
    expect(usePyxie.getState().history.length).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// settingsSlice
// ---------------------------------------------------------------------------
describe('settingsSlice', () => {
  beforeEach(resetStore);
  afterEach(() => {
    const g = globalThis as { Notification?: unknown };
    delete g.Notification;
  });

  it('toggleAlarm flips alarmEnabled', () => {
    expect(usePyxie.getState().settings.alarmEnabled).toBe(false);
    usePyxie.getState().toggleAlarm();
    expect(usePyxie.getState().settings.alarmEnabled).toBe(true);
    usePyxie.getState().toggleAlarm();
    expect(usePyxie.getState().settings.alarmEnabled).toBe(false);
  });

  it('toggleSound flips soundOn', () => {
    expect(usePyxie.getState().settings.soundOn).toBe(true);
    usePyxie.getState().toggleSound();
    expect(usePyxie.getState().settings.soundOn).toBe(false);
  });

  it('showExerciseGuide defaults to true', () => {
    expect(DEFAULT_SETTINGS.showExerciseGuide).toBe(true);
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(true);
  });

  it('toggleExerciseGuide flips showExerciseGuide', () => {
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(true);
    usePyxie.getState().toggleExerciseGuide();
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(false);
    usePyxie.getState().toggleExerciseGuide();
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(true);
  });

  it('setAlarmTime stores a valid hour/minute', () => {
    usePyxie.getState().setAlarmTime(9, 30);
    expect(usePyxie.getState().settings.alarmHour).toBe(9);
    expect(usePyxie.getState().settings.alarmMinute).toBe(30);
  });

  it('setAlarmTime rejects out-of-range values silently', () => {
    const before = usePyxie.getState().settings;
    usePyxie.getState().setAlarmTime(25, 0);
    usePyxie.getState().setAlarmTime(0, 99);
    usePyxie.getState().setAlarmTime(-1, 0);
    expect(usePyxie.getState().settings.alarmHour).toBe(before.alarmHour);
    expect(usePyxie.getState().settings.alarmMinute).toBe(before.alarmMinute);
  });

  it('fireAlarm uses today as default key', () => {
    usePyxie.getState().fireAlarm();
    expect(usePyxie.getState().ui.lastAlarmFired).toBe(new Date().toDateString());
  });

  it('fireAlarm fires a Notification when permission granted and pet exists', () => {
    const g = globalThis as { Notification?: unknown };
    const ctor = vi.fn();
    (ctor as { permission?: string }).permission = 'granted';
    g.Notification = ctor;
    usePyxie.setState({ pet: makePet() });
    usePyxie.getState().fireAlarm('key-1');
    expect(ctor).toHaveBeenCalledWith('Pyxie wants to train!', expect.objectContaining({ body: expect.any(String) }));
  });

  it('fireAlarm does not fire a Notification when permission is denied', () => {
    const g = globalThis as { Notification?: unknown };
    const ctor = vi.fn();
    (ctor as { permission?: string }).permission = 'denied';
    g.Notification = ctor;
    usePyxie.setState({ pet: makePet() });
    usePyxie.getState().fireAlarm('key-2');
    expect(ctor).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// installSlice
// ---------------------------------------------------------------------------
describe('installSlice', () => {
  beforeEach(resetStore);

  it('setDeferredPrompt stores the supplied event', () => {
    const fake = { prompt: () => Promise.resolve(), userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }) } as never;
    usePyxie.getState().setDeferredPrompt(fake);
    expect(usePyxie.getState().deferredPrompt).toBe(fake);
  });

  it('dismissInstallNudge sets the flag and clears the prompt', () => {
    const fake = {} as never;
    usePyxie.getState().setDeferredPrompt(fake);
    usePyxie.getState().dismissInstallNudge();
    expect(usePyxie.getState().installNudgeDismissed).toBe(true);
    expect(usePyxie.getState().deferredPrompt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// uiSlice
// ---------------------------------------------------------------------------
describe('uiSlice', () => {
  beforeEach(resetStore);

  it('setTab updates tab and clears previewList', () => {
    usePyxie.setState((s) => ({ ui: { ...s.ui, previewList: [{ name: 'a', cue: 'b', form: 'test form', animationId: 'push-ups' as const }] } }));
    usePyxie.getState().setTab('settings');
    expect(usePyxie.getState().ui.tab).toBe('settings');
    expect(usePyxie.getState().ui.previewList).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// persistenceSlice
// ---------------------------------------------------------------------------
describe('persistenceSlice — hydrate', () => {
  beforeEach(resetStore);

  it('is a no-op when nothing has been persisted', () => {
    const before = usePyxie.getState();
    usePyxie.getState().hydrate();
    const after = usePyxie.getState();
    expect(after.pet).toBe(before.pet);
    expect(after.history).toBe(before.history);
  });

  it('merges persisted settings on top of defaults', () => {
    localStorage.setItem('pyxie-state', JSON.stringify({
      pet: null,
      settings: { intensity: 'hard' },
      history: [],
      installNudgeDismissed: true,
      ui: { tab: 'settings' },
    }));
    usePyxie.getState().hydrate();
    const s = usePyxie.getState();
    expect(s.settings.intensity).toBe('hard');
    expect(s.settings.alarmHour).toBe(DEFAULT_SETTINGS.alarmHour); // default preserved
    expect(s.installNudgeDismissed).toBe(true);
    expect(s.ui.tab).toBe('settings');
  });

  it('defaults showExerciseGuide=true when a pre-ADR-0006 payload omits it', () => {
    // Simulate a persisted settings shape from before showExerciseGuide existed.
    localStorage.setItem('pyxie-state', JSON.stringify({
      pet: null,
      settings: { alarmEnabled: true, soundOn: false, intensity: 'medium', complexity: 'beginner', alarmHour: 8, alarmMinute: 0 },
      history: [],
      installNudgeDismissed: false,
      ui: { tab: 'pet' },
    }));
    usePyxie.getState().hydrate();
    const s = usePyxie.getState();
    expect(s.settings.showExerciseGuide).toBe(true);
    // Persisted fields still win where they were provided.
    expect(s.settings.alarmEnabled).toBe(true);
    expect(s.settings.soundOn).toBe(false);
  });

  it('tolerates a payload that omits optional fields', () => {
    localStorage.setItem('pyxie-state', JSON.stringify({}));
    usePyxie.getState().hydrate();
    const s = usePyxie.getState();
    expect(s.pet).toBeNull();
    expect(s.history).toEqual([]);
    expect(s.installNudgeDismissed).toBe(false);
    expect(s.ui.tab).toBe('pet');
  });
});

describe('persistenceSlice — persist', () => {
  beforeEach(resetStore);

  it('writes the persisted slice to storage', () => {
    usePyxie.setState({ pet: makePet({ name: 'Persisty' }), installNudgeDismissed: true });
    usePyxie.getState().persist();
    const raw = localStorage.getItem('pyxie-state');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.pet.name).toBe('Persisty');
    expect(parsed.installNudgeDismissed).toBe(true);
    expect(parsed.ui.tab).toBe('pet');
  });
});

// ---------------------------------------------------------------------------
// usePyxie auto-persist subscribe — dedup branch
// ---------------------------------------------------------------------------
describe('usePyxie auto-persist subscribe', () => {
  beforeEach(resetStore);
  afterEach(() => { vi.restoreAllMocks(); });

  it('skips the write when the persisted snapshot has not changed', () => {
    // Prime the snapshot so subsequent identical writes are deduped.
    usePyxie.getState().setTab('pet');
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    // Touching a non-persisted slice (deferredPrompt) should not trigger a write.
    usePyxie.getState().setDeferredPrompt(null);
    expect(spy).not.toHaveBeenCalled();
  });

  it('writes when a persisted key changes (after debounce window)', () => {
    vi.useFakeTimers();
    usePyxie.getState().setTab('pet'); // prime
    vi.advanceTimersByTime(300); // drain prime debounce
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    usePyxie.getState().toggleSound();
    expect(spy).not.toHaveBeenCalled(); // debounced, not yet flushed
    vi.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
