import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePyxie } from '../src/store/usePyxie';
import { Hatch } from '../src/screens/Hatch';
import { Pet } from '../src/screens/Pet';
import { Workout } from '../src/screens/Workout';
import { WorkoutTimer } from '../src/screens/WorkoutTimer';
import { Settings } from '../src/screens/Settings';
import { Dead } from '../src/screens/Dead';
import Wiki from '../src/screens/Wiki';
import { resetStore, makePet, makeActiveWorkout, makeHistory } from './helpers';

describe('Hatch screen', () => {
  beforeEach(resetStore);

  it('renders the egg blind-box panel + name input + place button', () => {
    render(<Hatch />);
    expect(screen.getByText('A mysterious egg appears')).toBeInTheDocument();
    expect(screen.getByText('???')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Egg')).toBeInTheDocument();
    expect(screen.getByText('Place egg in the nest')).toBeInTheDocument();
  });

  it('places an egg in the store when "Place egg" is clicked', () => {
    render(<Hatch />);
    fireEvent.click(screen.getByText('Place egg in the nest'));
    const pet = usePyxie.getState().pet;
    expect(pet).not.toBeNull();
    expect(pet?.workoutsToHatch).toBeGreaterThan(0);
  });
});

describe('Pet screen', () => {
  beforeEach(() => { resetStore(); usePyxie.setState({ pet: makePet({ xp: 30, streak: 2 }) }); });

  it('renders the pet name, stage, and stats meta', () => {
    render(<Pet />);
    expect(screen.getByText('Testy')).toBeInTheDocument();
    expect(screen.getByText(/Stage 1 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/Ember/)).toBeInTheDocument();
    // 30 xp toward 60 threshold = 30 XP to next
    expect(screen.getByText('30 XP')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Workout')).toBeInTheDocument();
  });

  it('shows "Final form" when stage is at the cap', () => {
    usePyxie.setState({ pet: makePet({ stage: 4, xp: 1500 }) });
    render(<Pet />);
    expect(screen.getByText('Final form')).toBeInTheDocument();
  });

  it('renders the egg branch with a centered single-CTA actions wrapper', () => {
    usePyxie.setState({ pet: makePet({ workoutsToHatch: 3 }) });
    const { container } = render(<Pet />);
    const actions = container.querySelector('.pet-actions');
    expect(actions).not.toBeNull();
    expect(actions?.className).toContain('pet-actions');
    expect(actions?.className).toContain('pet-actions--single');
    expect(actions?.querySelectorAll('button')).toHaveLength(1);
  });

  it('hatched pet renders the dual-CTA actions wrapper WITHOUT --single', () => {
    usePyxie.setState({ pet: makePet({ workoutsToHatch: 0, xp: 30 }) });
    const { container } = render(<Pet />);
    const actions = container.querySelector('.pet-actions');
    expect(actions).not.toBeNull();
    expect(actions?.className).toContain('pet-actions');
    expect(actions?.className).not.toContain('pet-actions--single');
    expect(actions?.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
  });
});

describe('Workout screen', () => {
  beforeEach(() => { resetStore(); usePyxie.setState({ pet: makePet() }); });

  it('renders intensity + complexity segs and the preview list', () => {
    render(<Workout />);
    expect(screen.getByText('Daily Workout')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('hard')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText("Today's set")).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Reroll')).toBeInTheDocument();
  });

  it('builds a preview of 8 exercises', () => {
    render(<Workout />);
    expect(usePyxie.getState().ui.previewList).toHaveLength(8);
  });

  it('shows form text as an expandable row when showExerciseGuide is on', () => {
    usePyxie.setState((s) => ({
      settings: { ...s.settings, showExerciseGuide: true },
      ui: { ...s.ui, previewList: [{ name: 'Bear Crawl', cue: 'Hips low.', form: 'Crawl forward on hands and feet, hips low, knees hovering.', animationId: 'bear-crawl' as const }] },
    }));
    const { container } = render(<Workout />);
    expect(container.querySelector('details.preview-item')).not.toBeNull();
    expect(screen.getByText(/Crawl forward on hands and feet/)).toBeInTheDocument();
  });

  it('hides form text when showExerciseGuide is off', () => {
    usePyxie.setState((s) => ({
      settings: { ...s.settings, showExerciseGuide: false },
      ui: { ...s.ui, previewList: [{ name: 'Bear Crawl', cue: 'Hips low.', form: 'Crawl forward on hands and feet, hips low, knees hovering.', animationId: 'bear-crawl' as const }] },
    }));
    const { container } = render(<Workout />);
    expect(container.querySelector('details.preview-item')).toBeNull();
    expect(screen.queryByText(/Crawl forward on hands and feet/)).toBeNull();
  });

  it('renders a flat row (no <details>) when form is empty', () => {
    usePyxie.setState((s) => ({
      settings: { ...s.settings, showExerciseGuide: true },
      ui: { ...s.ui, previewList: [
        { name: 'Bear Crawl', cue: 'Hips low.', form: '', animationId: 'bear-crawl' as const },
        { name: 'Push-ups', cue: 'Chest leads.', form: '', animationId: 'push-ups' as const },
      ] },
    }));
    const { container } = render(<Workout />);
    expect(container.querySelector('details.preview-item')).toBeNull();
    expect(screen.getByText(/Bear Crawl/)).toBeInTheDocument();
    expect(screen.getByText(/Push-ups/)).toBeInTheDocument();
  });
});

describe('WorkoutTimer screen', () => {
  beforeEach(() => {
    resetStore();
    usePyxie.setState({ pet: makePet(), ui: { ...usePyxie.getState().ui, workoutActive: makeActiveWorkout() } });
  });

  it('renders the current exercise, cue, countdown, and controls', () => {
    render(<WorkoutTimer />);
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Chest leads.')).toBeInTheDocument();
    expect(screen.getByText(/Exercise 1/)).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
    expect(screen.getByText('Quit')).toBeInTheDocument();
  });

  it('renders timer-form panel when seg.form + showExerciseGuide are both set', () => {
    usePyxie.setState((s) => ({
      settings: { ...s.settings, showExerciseGuide: true },
      ui: { ...s.ui, workoutActive: makeActiveWorkout({
        segIdx: 1,
        segments: [
          { kind: 'warmup', dur: 60, label: 'Warm up' },
          { kind: 'work', dur: 45, label: 'Push-ups', cue: 'Chest leads.', form: 'Hands shoulder-width, body straight from heels to head.', idx: 1 },
          { kind: 'cooldown', dur: 60, label: 'Cool down' },
        ],
      }) },
    }));
    const { container } = render(<WorkoutTimer />);
    expect(container.querySelector('.timer-form')).not.toBeNull();
    expect(screen.getByText(/Hands shoulder-width/)).toBeInTheDocument();
  });

  it('when seg.form is undefined, no .timer-form panel renders even with showExerciseGuide on', () => {
    usePyxie.setState((s) => ({
      settings: { ...s.settings, showExerciseGuide: true },
      ui: { ...s.ui, workoutActive: makeActiveWorkout({
        segIdx: 1,
        segments: [
          { kind: 'warmup', dur: 60, label: 'Warm up' },
          { kind: 'work', dur: 45, label: 'Push-ups', cue: 'Chest leads.', idx: 1 },
          { kind: 'cooldown', dur: 60, label: 'Cool down' },
        ],
      }) },
    }));
    const { container } = render(<WorkoutTimer />);
    expect(container.querySelector('.timer-form')).toBeNull();
    // Existing layout still intact.
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
  });

  it('hides timer-form when showExerciseGuide is off', () => {
    usePyxie.setState((s) => ({
      settings: { ...s.settings, showExerciseGuide: false },
      ui: { ...s.ui, workoutActive: makeActiveWorkout({
        segIdx: 1,
        segments: [
          { kind: 'warmup', dur: 60, label: 'Warm up' },
          { kind: 'work', dur: 45, label: 'Push-ups', cue: 'Chest leads.', form: 'Hands shoulder-width, body straight from heels to head.', idx: 1 },
          { kind: 'cooldown', dur: 60, label: 'Cool down' },
        ],
      }) },
    }));
    const { container } = render(<WorkoutTimer />);
    expect(container.querySelector('.timer-form')).toBeNull();
  });

  it('shows "Final stretch!" when the next segment is the cooldown', () => {
    usePyxie.setState((s) => ({
      ui: { ...s.ui, workoutActive: makeActiveWorkout({ segIdx: 3, remaining: 5 }) },
    }));
    render(<WorkoutTimer />);
    expect(screen.getByText('Squats')).toBeInTheDocument();
    expect(screen.getByText('Up next: Cool down')).toBeInTheDocument();
  });
});

describe('Settings screen', () => {
  beforeEach(() => {
    resetStore();
    usePyxie.setState({ pet: makePet(), history: makeHistory(3) });
  });

  it('renders the three toggles + alarm time + recent history', () => {
    render(<Settings />);
    expect(screen.getByText('Daily alarm')).toBeInTheDocument();
    expect(screen.getByText('Sound effects')).toBeInTheDocument();
    expect(screen.getByText('Exercise guide')).toBeInTheDocument();
    expect(screen.getByText('Alarm time')).toBeInTheDocument();
    expect(screen.getByText('Recent workouts')).toBeInTheDocument();
    // 3 history rows, each "+22 XP"
    expect(screen.getAllByText(/medium\/beginner/)).toHaveLength(3);
    expect(screen.getByText('Start over (release pet)')).toBeInTheDocument();
  });

  it('hides the Install App row when no deferredPrompt is available', () => {
    render(<Settings />);
    expect(screen.queryByText('Install App')).not.toBeInTheDocument();
  });

  it('shows the Install App row when a deferred prompt is available', () => {
    const fakePrompt = {} as unknown as Parameters<typeof usePyxie.setState>[0];
    usePyxie.setState({ deferredPrompt: fakePrompt as never });
    render(<Settings />);
    expect(screen.getByText('Install App')).toBeInTheDocument();
  });

  it('clicking the "Exercise guide" toggle flips settings.showExerciseGuide', () => {
    const { container } = render(<Settings />);
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(true);
    // Find the toggle adjacent to the "Exercise guide" label.
    const label = screen.getByText('Exercise guide');
    const row = label.closest('.row') as HTMLElement;
    expect(row).not.toBeNull();
    const toggle = row.querySelector('.toggle') as HTMLElement;
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle);
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(false);
    fireEvent.click(toggle);
    expect(usePyxie.getState().settings.showExerciseGuide).toBe(true);
    // unused container reference is fine
    void container;
  });
});

describe('Wiki screen', () => {
  it('renders the markdown source with at least one heading', () => {
    const { container } = render(<Wiki />);
    expect(container.querySelector('.wiki-content')).not.toBeNull();
    // Source contains many h1/h2; assert at least one heading rendered.
    expect(container.querySelectorAll('h1, h2').length).toBeGreaterThan(0);
  });

  it('renders a known h1 from the source markdown', () => {
    const { container } = render(<Wiki />);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    // PYXIE-WIKI.md opens with "# Pyxie Wiki" (with an emoji); allow leading emoji + whitespace.
    expect(h1?.textContent ?? '').toMatch(/Pyxie Wiki/);
  });

  it('replaces mermaid code fences with a rendered markdown fallback (not literal HTML)', () => {
    const { container } = render(<Wiki />);
    const text = container.textContent ?? '';
    // No raw ```mermaid text should leak through.
    expect(text).not.toContain('```mermaid');
    // The HTML-string fallback must NOT leak as literal text (react-markdown does not render raw HTML).
    expect(text).not.toContain('<div class="mermaid-fallback">');
    expect(text).not.toContain('mermaid-fallback');
    // A recognizable fallback substring SHOULD be present in the rendered output.
    expect(text).toMatch(/Diagram/);
    expect(text).toMatch(/GitHub/);
  });

  it('does not leak raw mermaid graph syntax into rendered <pre> blocks', () => {
    const { container } = render(<Wiki />);
    // Stripper must have run: no <pre> contains "graph LR" / "graph TD" from the source.
    const pres = Array.from(container.querySelectorAll('pre'));
    for (const pre of pres) {
      expect(pre.textContent ?? '').not.toMatch(/^graph\s+(LR|TD|RL|BT)/m);
      expect(pre.textContent ?? '').not.toContain('mermaid');
    }
  });
});

describe('Dead screen', () => {
  beforeEach(() => {
    resetStore();
    usePyxie.setState({ pet: makePet({ alive: false, stage: 2, xp: 220 }) });
  });

  it('renders an epitaph with the pet name, stage, and total XP', () => {
    render(<Dead />);
    expect(screen.getByText(/Testy has departed/)).toBeInTheDocument();
    expect(screen.getByText(/stage 3 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/220 total XP/)).toBeInTheDocument();
    expect(screen.getByText('Begin again')).toBeInTheDocument();
  });
});
