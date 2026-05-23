# Pyxie Workout — Code Audit

Date: 2026-05-23
Scope: `src/` (React 18 + TS + Vite + zustand + vitest)
Format: REPORT ONLY — no source code modified.

## Executive Summary

- **Overall health: Good.** The recent slice/sub-section refactors are clean; types are mostly tight; pure helpers (`decay`, `progression`, `workout`, `install`) are well-isolated and testable. 151 tests + clean typecheck/build give a strong safety net.
- **Largest risk surface is the timer loop.** `setInterval(tickWorkout, 1000)` in `WorkoutTimer.tsx` paired with `remaining - 1` per tick is wall-clock-blind: backgrounded tabs, throttled timers, or a sub-second mount drift will produce timing skew and (combined with the auto-persist subscribe) a noticeable write-amplification cost (one localStorage JSON.stringify per second during a 10-minute workout).
- **Accessibility and input hygiene have low-effort gaps.** Toggle `<div>`s in settings are not keyboard-focusable; alarm time inputs accept any text without `inputMode`/`pattern`; multiple list `.map`s key on array index. None are correctness bugs, but they're cheap wins.

Total findings: **18** (HIGH: 3, MEDIUM: 8, LOW: 7).

---

## HIGH

### H1 — Timer drifts under tab throttling and over-persists
- **Type:** bug / perf
- **Location:** `src/screens/WorkoutTimer.tsx:19-22`, `src/store/slices/workoutSlice.ts:60-79`, `src/store/usePyxie.ts:35-43`
- **Description:** `tickWorkout` decrements `remaining` by 1 every interval fire instead of computing elapsed wall-clock from `w.startedAt` / segment-start. Browser throttles `setInterval` to ~1Hz max in background tabs and may pause entirely, so a backgrounded workout under-counts. Each tick also mutates `ui.workoutActive`, which the auto-persist subscriber serializes to localStorage — but `workoutActive` is intentionally session-only, so this is wasted I/O (the `PERSISTED_KEYS` snapshot doesn't include it, but `JSON.stringify` still runs on every tick).
- **Fix:** Drive timing from `Date.now() - segmentStartedAt`; recompute `remaining` on each tick and on visibility-change. Also memoize/skip subscriber work when only `ui.workoutActive` changed (or compare on the projected snapshot before stringify).

### H2 — `persist()` runs synchronously on `beforeunload` and on every state change
- **Type:** perf / bug (potential data loss)
- **Location:** `src/store/usePyxie.ts:35-43`, `src/hooks/usePersistenceLifecycle.ts:7-15`
- **Description:** The store subscribes on every change and calls `JSON.stringify({...})` + `localStorage.setItem` synchronously. Combined with the 1Hz workout tick, every state mutation pays a stringify on the entire persisted slice. The `beforeunload` handler also writes — but modern browsers may abort sync work, and Safari iOS in particular ignores `beforeunload`. Recommend `pagehide` + `visibilitychange` (already half-done).
- **Fix:** Debounce persist (e.g., 250ms trailing edge); replace `beforeunload` with `pagehide`; gate the subscriber on whether the projected snapshot keys actually changed before stringifying.

### H3 — `localStorage` quota / SecurityError on first access not surfaced
- **Type:** bug
- **Location:** `src/lib/storage.ts:9-13, 25-40`
- **Description:** `localStorage.getItem`/`setItem` is invoked at module top-level (`window.storage = localStorageAdapter`) inside `if (typeof window !== 'undefined')`. Safari Private Mode historically throws `SecurityError` from the *getter* itself (`localStorage` access). `loadPersisted`/`savePersisted` swallow inside try/catch, but `localStorageAdapter`'s lambdas reference `localStorage` which can throw on construction-time access in some embedded WebViews. More importantly, when persist silently fails (quota exceeded after streak/history growth), the user gets no signal and their pet appears to die on next reload.
- **Fix:** Wrap `localStorage` access in a probe at adapter init (`try { localStorage.setItem('__probe','1'); localStorage.removeItem('__probe'); } catch {}`); expose a `storageHealthy` flag so the UI can warn once on degraded persistence.

---

## MEDIUM

### M1 — Non-null assertion in `workoutSlice.finishWorkout`
- **Type:** type-safety
- **Location:** `src/store/slices/workoutSlice.ts:105` (`result.pet.lastWorkout!`)
- **Description:** `applyWorkoutResult` always sets `lastWorkout: now`, so the `!` is safe today, but the type system doesn't enforce that contract. A future refactor of `applyWorkoutResult` could regress silently.
- **Fix:** Have `applyWorkoutResult` return `lastWorkout: number` directly (or destructure `now` into the history row instead of reading it back off pet).

### M2 — Non-null pet assertions in screen components
- **Type:** type-safety
- **Location:** `src/screens/Pet.tsx:7`, `src/screens/Dead.tsx:5`, `src/screens/WorkoutTimer.tsx:13`
- **Description:** `usePyxie((s) => s.pet)!` and `s.ui.workoutActive!` rely on `ScreenRouter`'s if-ladder for invariants. Hot-reload + fast `resetPet` could briefly render a stale screen against `pet === null`.
- **Fix:** Add an early `if (!pet) return null;` guard inside each screen; cheaper than threading non-null variants through the store.

### M3 — `useIosInstallNudge` reads DOM at render
- **Type:** smell / bug
- **Location:** `src/hooks/useIosInstallNudge.ts:10-18`
- **Description:** `isInstalledNow()` (touches `window.matchMedia` and `navigator.standalone`) and `navigator.userAgent` are called inside `useEffect` which is fine, but the hook also has a missing return path on the else branch (no cleanup function returned). Not a bug today, but ESLint `consistent-return` would flag it.
- **Fix:** Always return `undefined` explicitly or wrap in `if/else`.

### M4 — `useDailyAlarm` can miss its minute under background throttling
- **Type:** bug
- **Location:** `src/hooks/useDailyAlarm.ts:14-25`
- **Description:** Poll runs every 30s. If the tab is backgrounded, throttle pushes the next fire past the target minute window and the alarm is skipped for the day. Comparison is exact `getHours() === H && getMinutes() === M`.
- **Fix:** Compare against `lastAlarmFired`'s date plus a "we are at or past today's target time and haven't fired today" check (so even if poll lands at 7:01 we still fire 7:00's alarm).

### M5 — `useDecayLoop` only ticks while the tab is open
- **Type:** smell
- **Location:** `src/hooks/useDecayLoop.ts:9-13`
- **Description:** Decay math in `applyDecay` is delta-based (`now - lastDecay`), so re-opening after days correctly catches up. But there's no `visibilitychange` hook to force a tick when the user returns — they'll see stale stats for up to 60s.
- **Fix:** Add `document.addEventListener('visibilitychange', decayTick)` alongside the interval.

### M6 — `Math.random` shuffle bias in `pickExercises`
- **Type:** smell
- **Location:** `src/lib/workout.ts:7-11`
- **Description:** Fisher-Yates is correct, but `Math.random()` is not cryptographically uniform; over thousands of workouts certain orderings will be slightly favored. Mostly cosmetic for a workout app, flagged for completeness.
- **Fix:** Acceptable as-is; if ever a concern use `crypto.getRandomValues`.

### M7 — Auto-persist subscriber stringify cost
- **Type:** perf
- **Location:** `src/store/usePyxie.ts:35-43`
- **Description:** Every store mutation rebuilds an object via `Object.fromEntries(PERSISTED_KEYS.map(...))` and JSON.stringifies it just to compare with `lastSnapshot`. During the workout this fires once per second × 5 keys. Cheap individually, but unnecessary.
- **Fix:** Use reference equality on each persisted key (compare `state.pet === lastPet && state.settings === lastSettings && ...`) before stringifying.

### M8 — `confirm()` blocks main thread and can't be styled
- **Type:** smell / a11y
- **Location:** `src/screens/settings/ResetSection.tsx:7`
- **Description:** Native `confirm()` is allowed but inconsistent on iOS PWA and not themeable.
- **Fix:** Replace with an in-app confirm modal (cheap given existing `InstallModal` pattern).

---

## LOW

### L1 — Toggle `<div>`s are not keyboard-accessible
- **Type:** a11y
- **Location:** `src/screens/settings/AlarmSection.tsx:33`, `src/screens/settings/SoundSection.tsx:13`
- **Description:** `<div className="toggle" onClick={...}>` has no `role="switch"`, no `tabIndex`, no `aria-checked`, no keyboard handler.
- **Fix:** Use `<button role="switch" aria-checked={settings.alarmEnabled}>`.

### L2 — Alarm time inputs accept any text
- **Type:** smell / a11y
- **Location:** `src/screens/settings/AlarmSection.tsx:41-45`
- **Description:** `<input type="text">` with no `inputMode="numeric"`, no `pattern`, no validation feedback. iOS keyboard pops alpha.
- **Fix:** `type="text" inputMode="numeric" pattern="[0-9]*"` (or `type="time"` for the whole control).

### L3 — `key={i}` on list maps
- **Type:** smell
- **Location:** `src/screens/Workout.tsx:43`, `src/screens/settings/HistorySection.tsx:15`
- **Description:** Re-rolling preview / unshifting history will reuse keys and confuse React reconciliation if items animate.
- **Fix:** Use `key={e.name + i}` for preview, `key={h.date}` for history (date is unix-ms timestamp, unique enough).

### L4 — `parseInt` without radix removed but `!isNaN` used
- **Type:** smell
- **Location:** `src/screens/settings/AlarmSection.tsx:14-17`
- **Description:** Radix is supplied (good), but `!isNaN(parseInt(...))` is the legacy idiom; `Number.isFinite` is the modern one and rejects `Infinity`.
- **Fix:** `Number.isFinite(h)` for consistency with `clampAlarm`.

### L5 — `JSX.Element[]` typing in `Sprite`
- **Type:** type-safety
- **Location:** `src/components/Sprite.tsx:15`
- **Description:** `JSX.Element` is a global from the old JSX runtime; with React 18's automatic JSX runtime, prefer `import type { ReactElement } from 'react'` for forward compatibility (React 19 removes the global).
- **Fix:** `const rects: ReactElement[] = []`.

### L6 — `PHASE_LABEL` index by `seg.kind: SegmentKind` could miss exhaustiveness
- **Type:** type-safety
- **Location:** `src/screens/WorkoutTimer.tsx:5-10, 33-34`
- **Description:** `PHASE_LABEL[seg.kind]` is typed as `Record<string, ...>` so a new `SegmentKind` value won't cause a compile error.
- **Fix:** Type as `Record<SegmentKind, string | ((w: ActiveWorkout) => string)>`.

### L7 — Magic number `30` (history cap) and `8` (exercise count) hardcoded
- **Type:** smell
- **Location:** `src/store/slices/workoutSlice.ts:107` (`.slice(0, 30)`), `:36, :45` (`pickExercises(..., 8)`)
- **Description:** Both belong in `data/constants.ts` next to `XP_THRESHOLDS` for discoverability and tunability.
- **Fix:** Add `HISTORY_LIMIT = 30` and `WORKOUT_EXERCISE_COUNT = 8` to constants.

---

## Notes / Non-Findings (explicitly considered, intentionally not flagged)

- Auto-persist subscribe at module top-level in `src/store/usePyxie.ts` — flagged as intentional per audit brief.
- Slice split and Settings sub-section split — recent refactor, intentionally out of scope.
- `as const` in `data/constants.ts` — correct usage.
- `loadPersisted() as Partial<Persisted>` cast — necessary boundary cast at JSON.parse edge; acceptable.
- `(window as WebkitWindow)` in `audio.ts` — narrow, well-typed extension; acceptable.
- `(navigator as Navigator & { standalone?: boolean })` in `install.ts` — same pattern, acceptable.
- `document.getElementById('root')!` in `main.tsx` — universally acceptable bootstrap pattern.

## Dead / Unused

- No dead exports detected in `src/lib` or `src/data` via spot-check. `MOODS` consumed by `decay.ts`; `XP_THRESHOLDS` by `usePyxie` + `progression`; `DEFAULT_SESSION_UI` / `DEFAULT_PERSISTED_UI` exported but only `DEFAULT_UI` is used externally — consider not exporting the two halves if no consumer.
