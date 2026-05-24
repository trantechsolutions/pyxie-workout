import { describe, it, expect } from 'vitest';
import { applyDecay } from '../src/lib/decay';
import type { Pet } from '../src/store/types';

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

// Convention: lastDecay = 0 is treated as falsy (= "never decayed, use now") by
// applyDecay, identical to the original codebase. Tests must use a positive ms.
const T0 = 1_700_000_000_000;

function makePet(over: Partial<Pet> = {}): Pet {
  return {
    name: 'Test', line: 'ember', stage: 0,
    hunger: 100, happiness: 100, energy: 100,
    xp: 0, streak: 5, alive: true,
    born: T0, lastDecay: T0, lastWorkout: null, criticalSince: null,
    workoutsToHatch: 0,
    workoutCounts: {
      intensity:  { easy: 0, medium: 0, hard: 0 },
      complexity: { beginner: 0, intermediate: 0, advanced: 0 },
    },
    lineageId: 'ember',
    ...over,
  };
}

describe('applyDecay', () => {
  it('returns the pet unchanged when less than 30 minutes has passed', () => {
    const pet = makePet();
    expect(applyDecay(pet, T0 + HOUR * 0.4)).toBe(pet);
  });

  it('applies hourly decay rates of 1.6 / 1.2 / 1.0', () => {
    const pet = makePet();
    const next = applyDecay(pet, T0 + HOUR * 10);
    expect(next.hunger).toBeCloseTo(100 - 16, 5);
    expect(next.happiness).toBeCloseTo(100 - 12, 5);
    expect(next.energy).toBeCloseTo(100 - 10, 5);
  });

  it('clamps stats at 0', () => {
    const pet = makePet({ hunger: 1, happiness: 1, energy: 1 });
    const next = applyDecay(pet, T0 + HOUR * 100);
    expect(next.hunger).toBe(0);
    expect(next.happiness).toBe(0);
    expect(next.energy).toBe(0);
  });

  it('resets streak when last workout was more than 1 day ago', () => {
    const pet = makePet({ lastWorkout: T0, streak: 5 });
    const next = applyDecay(pet, T0 + DAY * 2 + HOUR);
    expect(next.streak).toBe(0);
  });

  it('preserves streak when last workout was today', () => {
    const pet = makePet({ lastWorkout: T0, streak: 5 });
    const next = applyDecay(pet, T0 + HOUR * 0.6);
    expect(next.streak).toBe(5);
  });

  it('marks criticalSince when hunger and happiness both hit 0', () => {
    const pet = makePet({ hunger: 0, happiness: 0, criticalSince: null });
    const next = applyDecay(pet, T0 + HOUR);
    expect(next.criticalSince).not.toBeNull();
    expect(next.alive).toBe(true);
  });

  it('kills the pet after 2 days fully starved', () => {
    const pet = makePet({ hunger: 0, happiness: 0, criticalSince: T0 });
    const next = applyDecay(pet, T0 + DAY * 2 + HOUR);
    expect(next.alive).toBe(false);
  });

  it('clears criticalSince when stats recover above 0', () => {
    const pet = makePet({ hunger: 50, happiness: 50, criticalSince: T0 - 1000 });
    const next = applyDecay(pet, T0 + HOUR);
    expect(next.criticalSince).toBeNull();
  });

  it('is a no-op on dead pets', () => {
    const pet = makePet({ alive: false });
    expect(applyDecay(pet, T0 + HOUR * 100)).toBe(pet);
  });
});
