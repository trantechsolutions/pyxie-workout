# ADR-0002 — Egg / Hatch Blind-Box (Phase 1)

- Status: Accepted
- Date: 2026-05-23
- Authors: Jonathan V Tran

## Context

The original starter flow let the user pick one of three lines (`ember`, `tide`, `verdant`) and name the resulting stage-0 creature. Once placed, the pet immediately accrued XP and could evolve before the user had any sense of the creature's identity.

We want a stronger "what's in the box?" hook that:
- Defers reveal of the baseline creature until the user has demonstrated commitment.
- Tracks workout-style data (intensity × complexity) for use by the future branching-evolution system (ADR-0003).
- Preserves existing pet save data on upgrade.

## Decision

Replace starter selection with a single mystery egg.

- `Pet` gains two persisted fields:
  - `workoutsToHatch: number` — counts down to 0 on hatch.
  - `workoutCounts: { intensity: Record<Intensity, number>, complexity: Record<Complexity, number> }` — running tallies of completed workouts by profile.
- `placeEgg()` action creates a pet with a randomly rolled egg color (visual flavor only), `workoutsToHatch = HATCH_WORKOUTS` (3), zeroed counts. Egg color is independent of the eventual baseline.
- `finishWorkout(true)` tallies the workout into `workoutCounts`, then decrements `workoutsToHatch` and — if it crosses to 0 — re-rolls `pet.line` from `HATCHABLE_BASELINES` (currently `['ember','tide','verdant']`) **independent of egg color**. This is the true blind-box.
- During the egg phase XP is suppressed via `xpMultiplier = 0`, so the stage-1 creature is always visible after hatch before any evolution can occur.
- `Hatch.tsx` is rewritten to a single mystery-egg card + name field + "Place egg in the nest" button.
- `Pet.tsx` renders an `EggSprite` + "Hatches in N workouts" while incubating; reverts to the existing pet UI once `workoutsToHatch === 0`.

## Persistence Migration

`persistenceSlice.hydrate` runs `migratePet(loaded.pet)` which defaults missing egg fields:

- `workoutsToHatch ??= 0` (existing saves are treated as already-hatched).
- `workoutCounts ??= EMPTY_WORKOUT_COUNTS`.

Existing users keep their current pet/line/stage. New tallies start from zero.

## Considered Alternatives

| Option | Why not |
|---|---|
| Pick an egg color, deterministic baseline | Less blind-box; egg color would telegraph the result. |
| No egg phase, just expand baselines | Misses the commitment hook and the lore for ADR-0003 ratios. |
| Egg phase awards XP normally | Stage-1 form might be skipped if the user completes a heavy session before hatch. |

## Risks & Rollback

- **Risk:** users with mid-evolution legacy pets see no behavior change — by design. Verified by `hydrate migration` test.
- **Risk:** RNG bias if `Math.random` is mocked elsewhere — distribution tests (1500 placeEgg trials, 600 hatch trials) catch structural bucket loss within ±25%.
- **Rollback:** flip `HATCH_WORKOUTS = 0` and revert `Hatch.tsx` to the StarterCard flow. No data migration required (egg fields persist harmlessly).

## Out of Scope / Follow-ups

- Branching evolution by workout-type ratio → ADR-0003.
- Baseline roster expansion beyond three lines → ADR-0004.
- Workout-complete summary screen showing earned multiplier and remaining hatch countdown.
