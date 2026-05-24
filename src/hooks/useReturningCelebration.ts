import { useEffect, useRef, useState } from 'react';
import type { ConstellationMember, ConstellationResponse } from '../lib/familyTypes';

// ADR-0007 Milestone 6: "returning celebration" detection.
//
// Watches successive constellation responses. When any member's status flips
// from `sleeping` to `active`, returns their user_id in `celebrating` for a
// short animation window (default 2s). New-member-first-appearance does NOT
// trigger — the transition must be sleeping -> active. Tone-check from the
// brainstorming doc: this reads as "welcome back," not "you finally showed up."

const CELEBRATION_WINDOW_MS = 2_000;

export interface UseReturningCelebrationResult {
  celebrating: string[];
}

interface ActiveCelebration {
  userId: string;
  expiresAt: number;
}

export function useReturningCelebration(
  data: ConstellationResponse | null,
  windowMs: number = CELEBRATION_WINDOW_MS,
): UseReturningCelebrationResult {
  // Map of user_id -> previous status, so we can detect the sleeping->active flip.
  const prevStatusRef = useRef<Map<string, ConstellationMember['status']>>(new Map());
  const [active, setActive] = useState<ActiveCelebration[]>([]);

  useEffect(() => {
    if (!data) return;
    const prev = prevStatusRef.current;
    const triggered: string[] = [];
    for (const m of data.members) {
      const before = prev.get(m.user_id);
      if (before === 'sleeping' && m.status === 'active') {
        triggered.push(m.user_id);
      }
    }
    // Update memory AFTER reading so the next render sees this response as prior.
    const next = new Map<string, ConstellationMember['status']>();
    for (const m of data.members) next.set(m.user_id, m.status);
    prevStatusRef.current = next;

    if (triggered.length === 0) return;
    const expiresAt = Date.now() + windowMs;
    setActive((curr) => {
      const merged = curr.filter((c) => c.expiresAt > Date.now());
      for (const userId of triggered) {
        // Replace any existing entry so repeated triggers extend the window.
        const idx = merged.findIndex((c) => c.userId === userId);
        if (idx >= 0) merged[idx] = { userId, expiresAt };
        else merged.push({ userId, expiresAt });
      }
      return merged;
    });
  }, [data, windowMs]);

  // Expire entries on a timer so consumers see celebrating: [] after windowMs.
  useEffect(() => {
    if (active.length === 0) return;
    const soonest = Math.min(...active.map((c) => c.expiresAt));
    const ms = Math.max(0, soonest - Date.now());
    const t = setTimeout(() => {
      setActive((curr) => curr.filter((c) => c.expiresAt > Date.now()));
    }, ms + 16); // +16 so we're past the boundary, not exactly on it.
    return () => clearTimeout(t);
  }, [active]);

  return { celebrating: active.map((c) => c.userId) };
}
