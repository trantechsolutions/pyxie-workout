import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReturningCelebration } from '../../src/hooks/useReturningCelebration';
import type { ConstellationResponse, ConstellationMember } from '../../src/lib/familyTypes';

// ADR-0007 Milestone 6: tests the sleeping->active transition detector.
// Brainstorming doc requirement: "welcome back," never "you finally showed up."
// First-appearance of a new member must NOT trigger; only seen->unseen->seen
// state changes do.

function member(over: Partial<ConstellationMember>): ConstellationMember {
  return {
    user_id: over.user_id ?? 'u',
    display_name: over.display_name ?? 'X',
    sprite: over.sprite ?? null,
    last_activity_at: over.last_activity_at ?? null,
    status: over.status ?? 'sleeping',
  };
}

function response(members: ConstellationMember[]): ConstellationResponse {
  return { family: { id: 'fam_1', name: 'F', invite_code: 'XYZ123' }, members };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useReturningCelebration', () => {
  it('fires when a member flips sleeping -> active across two responses', () => {
    const r1 = response([member({ user_id: 'user-a', status: 'sleeping' })]);
    const r2 = response([member({ user_id: 'user-a', status: 'active' })]);

    const { result, rerender } = renderHook(({ data }) => useReturningCelebration(data), {
      initialProps: { data: r1 },
    });
    expect(result.current.celebrating).toEqual([]);

    rerender({ data: r2 });
    expect(result.current.celebrating).toEqual(['user-a']);
  });

  it('expires the celebration after the window elapses', () => {
    const r1 = response([member({ user_id: 'user-a', status: 'sleeping' })]);
    const r2 = response([member({ user_id: 'user-a', status: 'active' })]);

    const { result, rerender } = renderHook(({ data }) => useReturningCelebration(data, 1_000), {
      initialProps: { data: r1 },
    });
    rerender({ data: r2 });
    expect(result.current.celebrating).toEqual(['user-a']);

    act(() => {
      vi.advanceTimersByTime(1_500);
    });
    expect(result.current.celebrating).toEqual([]);
  });

  it('does NOT trigger on a member first appearing (never previously seen)', () => {
    // First response has no members; second introduces user-a as active.
    const r1 = response([]);
    const r2 = response([member({ user_id: 'user-a', status: 'active' })]);

    const { result, rerender } = renderHook(({ data }) => useReturningCelebration(data), {
      initialProps: { data: r1 },
    });
    rerender({ data: r2 });
    expect(result.current.celebrating).toEqual([]);
  });

  it('does NOT trigger on drifting -> active (only sleeping -> active counts)', () => {
    const r1 = response([member({ user_id: 'user-a', status: 'drifting' })]);
    const r2 = response([member({ user_id: 'user-a', status: 'active' })]);

    const { result, rerender } = renderHook(({ data }) => useReturningCelebration(data), {
      initialProps: { data: r1 },
    });
    rerender({ data: r2 });
    expect(result.current.celebrating).toEqual([]);
  });

  it('handles multiple simultaneous returns', () => {
    const r1 = response([
      member({ user_id: 'user-a', status: 'sleeping' }),
      member({ user_id: 'user-b', status: 'sleeping' }),
    ]);
    const r2 = response([
      member({ user_id: 'user-a', status: 'active' }),
      member({ user_id: 'user-b', status: 'active' }),
    ]);

    const { result, rerender } = renderHook(({ data }) => useReturningCelebration(data), {
      initialProps: { data: r1 },
    });
    rerender({ data: r2 });
    expect(result.current.celebrating.sort()).toEqual(['user-a', 'user-b']);
  });

  it('does not fire on identical successive responses', () => {
    const r = response([member({ user_id: 'user-a', status: 'active' })]);
    const { result, rerender } = renderHook(({ data }) => useReturningCelebration(data), {
      initialProps: { data: r },
    });
    rerender({ data: r });
    expect(result.current.celebrating).toEqual([]);
  });
});
