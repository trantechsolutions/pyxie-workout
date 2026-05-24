import { describe, it, expect } from 'vitest';
import { pickExercises, buildSegments, xpFor } from '../src/lib/workout';
import { EXERCISES } from '../src/data/exercises';

describe('xpFor', () => {
  it('matches the canonical XP table', () => {
    expect(xpFor('easy', 'beginner')).toBe(12);
    expect(xpFor('easy', 'advanced')).toBe(18);
    expect(xpFor('medium', 'beginner')).toBe(22);
    expect(xpFor('medium', 'intermediate')).toBe(28);
    expect(xpFor('hard', 'beginner')).toBe(38);
    expect(xpFor('hard', 'advanced')).toBe(57);
  });
});

describe('pickExercises', () => {
  it('returns the requested count from the right bucket', () => {
    const picks = pickExercises('medium', 'beginner', 8);
    expect(picks).toHaveLength(8);
    for (const ex of picks) {
      expect(EXERCISES.medium.beginner.some((e) => e.name === ex.name)).toBe(true);
    }
  });
  it('returns unique exercises (no duplicates within a workout)', () => {
    const picks = pickExercises('hard', 'advanced', 8);
    const names = new Set(picks.map((p) => p.name));
    expect(names.size).toBe(picks.length);
  });
  it('falls back to medium/beginner if bucket missing', () => {
    // Cast to bypass TS — testing the runtime fallback path.
    const picks = pickExercises('mystery' as 'medium', 'beginner', 4);
    expect(picks).toHaveLength(4);
    for (const ex of picks) {
      expect(EXERCISES.medium.beginner.some((e) => e.name === ex.name)).toBe(true);
    }
  });
});

describe('buildSegments', () => {
  it('produces warmup + (work + rest)*7 + work + cooldown for 8 exercises', () => {
    const segs = buildSegments(pickExercises('medium', 'beginner', 8));
    // warmup(1) + work(8) + rest(7) + cooldown(1) = 17
    expect(segs).toHaveLength(17);
    expect(segs[0].kind).toBe('warmup');
    expect(segs[segs.length - 1].kind).toBe('cooldown');
    const totalDur = segs.reduce((a, s) => a + s.dur, 0);
    expect(totalDur).toBe(60 + 8 * 45 + 7 * 15 + 60); // 585 seconds = 9:45
  });
});

describe('EXERCISES data integrity', () => {
  it('has 90 exercises total across 9 buckets', () => {
    let count = 0;
    for (const intensity of Object.values(EXERCISES)) {
      for (const bucket of Object.values(intensity)) {
        expect(bucket.length).toBe(10);
        count += bucket.length;
      }
    }
    expect(count).toBe(90);
  });
});
