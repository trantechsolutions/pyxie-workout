import type { Intensity, Complexity, Exercise, Segment } from '../store/types';
import { EXERCISES } from '../data/exercises';

export function pickExercises(intensity: Intensity, complexity: Complexity, count: number): Exercise[] {
  const pool = [...(EXERCISES[intensity]?.[complexity] ?? EXERCISES.medium.beginner)];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function buildSegments(exList: Exercise[]): Segment[] {
  const segments: Segment[] = [{ kind: 'warmup', dur: 60, label: 'Warm up' }];
  exList.forEach((ex, i) => {
    segments.push({ kind: 'work', dur: 45, label: ex.name, cue: ex.cue, form: ex.form, movementPattern: ex.movementPattern, idx: i + 1 });
    if (i < exList.length - 1) segments.push({ kind: 'rest', dur: 15, label: 'Rest', next: exList[i + 1].name });
  });
  segments.push({ kind: 'cooldown', dur: 60, label: 'Cool down' });
  return segments;
}

const XP_BASE: Record<Intensity, number> = { easy: 12, medium: 22, hard: 38 };
const CX_MULT: Record<Complexity, number> = { beginner: 1.0, intermediate: 1.25, advanced: 1.5 };

export function xpFor(intensity: Intensity, complexity: Complexity): number {
  return Math.round(XP_BASE[intensity] * CX_MULT[complexity]);
}
