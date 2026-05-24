import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { usePyxie } from '../src/store/usePyxie';
import { App } from '../src/App';
import { resetStore, makePet, makeActiveWorkout } from './helpers';

vi.mock('../src/lib/audio', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/audio')>('../src/lib/audio');
  return { ...actual, beep: vi.fn(), ensureAudioCtx: vi.fn(() => null), requestNotificationPerm: vi.fn(async () => false) };
});

describe('App routing', () => {
  beforeEach(resetStore);

  it('renders Hatch when there is no pet', () => {
    render(<App />);
    expect(screen.getByText('A mysterious egg appears')).toBeInTheDocument();
  });

  it('renders Dead when pet.alive=false (regardless of tab)', () => {
    usePyxie.setState({
      pet: makePet({ alive: false, stage: 2, xp: 100 }),
      ui: { ...usePyxie.getState().ui, tab: 'workout' },
    });
    render(<App />);
    expect(screen.getByText(/has departed/)).toBeInTheDocument();
    expect(screen.queryByText('Daily Workout')).not.toBeInTheDocument();
  });

  it('renders WorkoutTimer when a workout is active (overrides tab)', () => {
    usePyxie.setState({
      pet: makePet(),
      ui: { ...usePyxie.getState().ui, tab: 'settings', workoutActive: makeActiveWorkout() },
    });
    render(<App />);
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    // Settings screen has a "Daily alarm" row; nav button "Settings" still exists.
    expect(screen.queryByText('Daily alarm')).not.toBeInTheDocument();
  });

  it('renders Workout when tab=workout and no workout is active', () => {
    usePyxie.setState({
      pet: makePet(),
      ui: { ...usePyxie.getState().ui, tab: 'workout' },
    });
    render(<App />);
    expect(screen.getByText('Daily Workout')).toBeInTheDocument();
  });

  it('renders Pet by default', () => {
    usePyxie.setState({ pet: makePet() });
    render(<App />);
    expect(screen.getByText('Testy')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('shows EvolutionFlash overlay when evolved is set', () => {
    usePyxie.setState({
      pet: makePet({ stage: 1 }),
      evolved: { pet: makePet({ stage: 1 }), from: 0 },
    });
    render(<App />);
    expect(screen.getByText(/evolved!/)).toBeInTheDocument();
  });

  it('clicking the evolution overlay acknowledges and clears it', () => {
    usePyxie.setState({
      pet: makePet({ stage: 1 }),
      evolved: { pet: makePet({ stage: 1 }), from: 0 },
    });
    render(<App />);
    const overlay = document.querySelector('.evo-flash') as HTMLElement;
    expect(overlay).not.toBeNull();
    act(() => { fireEvent.click(overlay); });
    expect(usePyxie.getState().evolved).toBeNull();
  });
});
