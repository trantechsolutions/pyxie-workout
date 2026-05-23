import type { Pet } from '../store/types';
import { MOODS } from '../data/constants';

const DAY_MS = 1000 * 60 * 60 * 24;

export function applyDecay(pet: Pet, now: number = Date.now()): Pet {
  if (!pet.alive) return pet;
  const last = pet.lastDecay || now;
  const hours = Math.max(0, (now - last) / (1000 * 60 * 60));
  if (hours < 0.5) return pet;

  const next: Pet = {
    ...pet,
    hunger:    Math.max(0, pet.hunger    - hours * 1.6),
    happiness: Math.max(0, pet.happiness - hours * 1.2),
    energy:    Math.max(0, pet.energy    - hours * 1.0),
    lastDecay: now,
  };

  if (next.lastWorkout) {
    const days = Math.floor((now - next.lastWorkout) / DAY_MS);
    if (days > 1) next.streak = 0;
  }

  if (next.hunger <= 0 && next.happiness <= 0) {
    next.criticalSince = next.criticalSince ?? now;
    if (now - next.criticalSince > 2 * DAY_MS) next.alive = false;
  } else {
    next.criticalSince = null;
  }

  return next;
}

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function petMood(pet: Pet | null): string {
  if (!pet) return '';
  const avg = (pet.hunger + pet.happiness + pet.energy) / 3;
  if (avg < 15) return pick(MOODS.weak);
  if (pet.hunger < 30) return pick(MOODS.hungry);
  if (pet.happiness < 30) return pick(MOODS.sad);
  if (pet.energy < 30) return pick(MOODS.tired);
  if (avg > 75) return pick(MOODS.great);
  return pick(MOODS.ok);
}
