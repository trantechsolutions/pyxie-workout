import type { Pet, Intensity, Complexity, WorkoutCounts } from '../store/types';
import { XP_THRESHOLDS, STREAK_MULT_STEP, STREAK_MULT_CAP_DAYS } from '../data/constants';
import { EVOLUTION_TREE, getNode, type BranchAxis } from '../data/evolutionTree';
import { xpFor } from './workout';

/**
 * Pick `primary` or `alt` based on the dominant bucket on the relevant axis.
 *
 *   intensity:  easy + medium → primary;  hard → alt.
 *   complexity: beginner      → primary;  intermediate + advanced → alt.
 *
 * Ties (zero counts, or matched totals) favor primary — fresh pets evolve
 * deterministically down the canonical spine.
 */
export function chooseBranch(axis: BranchAxis, counts: WorkoutCounts): 'primary' | 'alt' {
  if (axis === 'intensity') {
    const primaryScore = counts.intensity.easy + counts.intensity.medium;
    const altScore     = counts.intensity.hard;
    return altScore > primaryScore ? 'alt' : 'primary';
  }
  const primaryScore = counts.complexity.beginner;
  const altScore     = counts.complexity.intermediate + counts.complexity.advanced;
  return altScore > primaryScore ? 'alt' : 'primary';
}

/**
 * Resolve the next lineageId given the current node and the pet's habit counts.
 * Returns `null` if the current node is a final form (no children).
 */
export function nextLineageId(currentLineageId: string, counts: WorkoutCounts): string | null {
  const node = getNode(currentLineageId);
  if (!node || node.children === null || node.branchAxis === null) return null;
  const branch = chooseBranch(node.branchAxis, counts);
  return node.children[branch];
}

export function streakMultiplier(streak: number): number {
  if (streak <= 1) return 1;
  const days = Math.min(streak - 1, STREAK_MULT_CAP_DAYS);
  return 1 + days * STREAK_MULT_STEP;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function computeStreak(pet: Pet, now: number): number {
  if (!pet.lastWorkout) return 1;
  const days = Math.floor((now - pet.lastWorkout) / DAY_MS);
  if (days === 0) return pet.streak;
  if (days === 1) return pet.streak + 1;
  return 1;
}

export interface WorkoutResult {
  pet: Pet;
  evolved: { pet: Pet; from: number } | null;
  xpGained: number;
}

export function applyWorkoutResult(
  pet: Pet,
  intensity: Intensity,
  complexity: Complexity,
  now: number,
  xpMultiplier: number = 1,
): WorkoutResult {
  const effortMult = Math.max(0, Math.min(1, xpMultiplier));
  const newStreak = computeStreak(pet, now);
  // Streak multiplier is earned by the workout that establishes the streak,
  // i.e. computed off the post-workout streak value (day 1 = 1.0×).
  const streakMult = streakMultiplier(newStreak);
  const xpGained = Math.round(xpFor(intensity, complexity) * effortMult * streakMult);
  const newXp = pet.xp + xpGained;
  const fromStage = pet.stage;
  const threshold = XP_THRESHOLDS[fromStage + 1];
  const evolves = threshold !== undefined && newXp >= threshold && fromStage < 4;

  // Branching evolution: when crossing a stage threshold, traverse the tree.
  // The counts used for branch selection include the workout we're applying.
  let lineageId = pet.lineageId;
  if (evolves && pet.lineageId) {
    const projectedCounts: WorkoutCounts = {
      intensity:  { ...pet.workoutCounts.intensity,  [intensity]:  pet.workoutCounts.intensity[intensity]  + 1 },
      complexity: { ...pet.workoutCounts.complexity, [complexity]: pet.workoutCounts.complexity[complexity] + 1 },
    };
    const nextId = nextLineageId(pet.lineageId, projectedCounts);
    if (nextId && EVOLUTION_TREE[nextId]) {
      lineageId = nextId;
    }
  }
  const stage = evolves ? fromStage + 1 : fromStage;

  const next: Pet = {
    ...pet,
    xp: newXp,
    stage,
    lineageId,
    hunger:    Math.min(100, pet.hunger    + 28),
    happiness: Math.min(100, pet.happiness + 22),
    energy:    Math.min(100, pet.energy    + 18),
    streak: newStreak,
    lastWorkout: now,
  };

  return {
    pet: next,
    evolved: evolves ? { pet: next, from: fromStage } : null,
    xpGained,
  };
}

export function clampAlarm(h: number, m: number): { hour: number; minute: number } | null {
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const hour = Math.trunc(h);
  const minute = Math.trunc(m);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}
