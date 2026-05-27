import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../src/data/exercises';
import { ANIMATION_REGISTRY, getAnimationComponent, PlaceholderAnimation } from '../src/components/animations';
import type { Intensity, Complexity } from '../src/store/types';

const INTENSITIES: Intensity[] = ['easy', 'medium', 'hard'];
const COMPLEXITIES: Complexity[] = ['beginner', 'intermediate', 'advanced'];

function allExercises() {
  const out = [] as { i: Intensity; c: Complexity; name: string; animationId: string; form: string }[];
  for (const i of INTENSITIES) {
    for (const c of COMPLEXITIES) {
      for (const e of EXERCISES[i][c]) {
        out.push({ i, c, name: e.name, animationId: e.animationId, form: e.form });
      }
    }
  }
  return out;
}

describe('exercise guide data integrity', () => {
  it('every exercise has non-empty form text', () => {
    for (const e of allExercises()) {
      expect(e.form, `${e.i}/${e.c}/${e.name} missing form`).toBeTruthy();
      expect(e.form.length, `${e.i}/${e.c}/${e.name} form too short`).toBeGreaterThan(30);
    }
  });

  it('every exercise has a non-empty animationId', () => {
    for (const e of allExercises()) {
      expect(e.animationId, `${e.name} missing animationId`).toBeTruthy();
      expect(e.animationId.length, `${e.name} animationId too short`).toBeGreaterThan(0);
    }
  });

  it('every animationId is unique across all 90 exercises', () => {
    const ids = allExercises().map(e => e.animationId);
    const set = new Set(ids);
    expect(set.size, `expected 90 unique ids, got ${set.size}`).toBe(ids.length);
  });

  it('every animationId resolves to a registered component (no placeholder fallback)', () => {
    for (const e of allExercises()) {
      const c = getAnimationComponent(e.animationId);
      expect(c, `${e.name} id ${e.animationId} has no component`).toBeDefined();
      expect(c, `${e.name} id ${e.animationId} fell back to placeholder`).not.toBe(PlaceholderAnimation);
      expect(ANIMATION_REGISTRY[e.animationId], `${e.name} not in registry`).toBeDefined();
    }
  });

  it('every registered animation is used by exactly one exercise', () => {
    const used = new Set<string>();
    for (const e of allExercises()) used.add(e.animationId);
    for (const id of Object.keys(ANIMATION_REGISTRY)) {
      expect(used.has(id), `registry id ${id} has component but no exercise references it`).toBe(true);
    }
    expect(used.size, 'registry size should equal exercise count').toBe(Object.keys(ANIMATION_REGISTRY).length);
  });

  it('unknown animationId falls back to placeholder', () => {
    const c = getAnimationComponent('this-id-does-not-exist');
    expect(c).toBe(PlaceholderAnimation);
  });

  it('total exercises = 90 (3 intensities × 3 complexities × 10)', () => {
    expect(allExercises().length).toBe(90);
  });
});
