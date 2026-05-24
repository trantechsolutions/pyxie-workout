import { describe, it, expect } from 'vitest';
import { todayKey } from '../src/lib/time';

describe('todayKey', () => {
  it('returns the calendar date string for the given Date', () => {
    const d = new Date(2026, 4, 23, 9, 30); // local time, May 23 2026 09:30
    expect(todayKey(d)).toBe(d.toDateString());
  });

  it('is stable across times of day on the same calendar date', () => {
    const morning = new Date(2026, 4, 23, 0, 0, 1);
    const night = new Date(2026, 4, 23, 23, 59, 59);
    expect(todayKey(morning)).toBe(todayKey(night));
  });

  it('changes when the calendar date rolls over', () => {
    const day1 = new Date(2026, 4, 23, 23, 59, 59);
    const day2 = new Date(2026, 4, 24, 0, 0, 1);
    expect(todayKey(day1)).not.toBe(todayKey(day2));
  });

  it('defaults to the current date when called with no args', () => {
    expect(todayKey()).toBe(new Date().toDateString());
  });
});
