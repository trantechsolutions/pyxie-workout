import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../src/data/exercises';
import { ANIMATION_REGISTRY } from '../src/components/animations';
import type { Intensity, Complexity, MovementPattern } from '../src/store/types';

const INTENSITIES: Intensity[] = ['easy', 'medium', 'hard'];
const COMPLEXITIES: Complexity[] = ['beginner', 'intermediate', 'advanced'];

describe('exercise guide data integrity', () => {
  it('every exercise has non-empty form text', () => {
    for (const i of INTENSITIES) {
      for (const c of COMPLEXITIES) {
        for (const e of EXERCISES[i][c]) {
          expect(e.form, `${i}/${c}/${e.name} missing form`).toBeTruthy();
          expect(e.form.length, `${i}/${c}/${e.name} form too short`).toBeGreaterThan(30);
        }
      }
    }
  });

  it('every exercise has a valid movementPattern mapped to a registered animation', () => {
    for (const i of INTENSITIES) {
      for (const c of COMPLEXITIES) {
        for (const e of EXERCISES[i][c]) {
          expect(e.movementPattern, `${e.name} missing movementPattern`).toBeTruthy();
          expect(
            ANIMATION_REGISTRY[e.movementPattern as MovementPattern],
            `${e.name} pattern ${e.movementPattern} has no animation component`
          ).toBeDefined();
        }
      }
    }
  });

  it('every registered animation pattern is used by at least one exercise', () => {
    const used = new Set<MovementPattern>();
    for (const i of INTENSITIES) {
      for (const c of COMPLEXITIES) {
        for (const e of EXERCISES[i][c]) used.add(e.movementPattern);
      }
    }
    for (const pattern of Object.keys(ANIMATION_REGISTRY) as MovementPattern[]) {
      expect(used.has(pattern), `pattern ${pattern} has component but no exercises`).toBe(true);
    }
  });

  it('total exercises = 90 (3 intensities × 3 complexities × 10)', () => {
    let total = 0;
    for (const i of INTENSITIES) for (const c of COMPLEXITIES) total += EXERCISES[i][c].length;
    expect(total).toBe(90);
  });
});
