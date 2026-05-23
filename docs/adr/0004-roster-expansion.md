# ADR-0004 — Baseline Roster Expansion (Phase 3)

- Status: Proposed
- Date: 2026-05-23
- Authors: Jonathan V Tran

## Context

Phases 1 (egg/hatch, ADR-0002) and 2 (binary evolution tree, ADR-0003) operate on three baseline lines: `ember`, `tide`, `verdant`. The blind-box reveal is more compelling when the user knows there are *many* possible outcomes — three is too few. Adding baselines is mostly a content task once the data plumbing in ADR-0003 ships.

## Decision

Expand the baseline roster from 3 to 8 lines over time, drawn from elemental archetypes that pair cleanly with calisthenics flavor and palette work:

| Line       | Tagline                       | Vibe                                | Priority |
|------------|-------------------------------|-------------------------------------|----------|
| `ember`    | Forged in fire                | Existing — explosive intensity      | shipped  |
| `tide`     | Born of the deep              | Existing — fluid endurance          | shipped  |
| `verdant`  | Rooted in earth               | Existing — steady strength          | shipped  |
| `gale`     | Carried on the wind           | Mobility, speed, jump complexity    | next     |
| `stone`    | Patient and unbroken          | Static holds, isometrics            | next     |
| `umbra`    | Shaped in shadow              | Night training, dim-cool palette    | later    |
| `aurora`   | Lit from within               | Recovery focus, pastel palette      | later    |
| `static`   | Charged and restless          | High-frequency intervals            | later    |

### Mechanical changes

- `HATCHABLE_BASELINES` in `workoutSlice.ts` extends to include each new line as that line ships.
- `PALETTES` in `creatures.ts` gains 8-color entries per new line.
- `LINE_INFO` gains `{ label, tagline, color }` per new line.
- Each new baseline contributes a stage-1 grid plus a sub-tree of the evolution tree (ADR-0003): one new baseline = up to 15 new evolution nodes (1 + 2 + 4 + 8) if branched fully, or fewer if shipped partially.

### Rollout cadence

To avoid art bottlenecks blocking the system:

1. Ship a new baseline as a single stage-1 grid + a "primary spine" of stages 2-5 (5 grids total).
2. Backfill the alt-branches at each stage in follow-up PRs.
3. Display "art pending" placeholder (per ADR-0003) for any unauthored alt-node.

### Drop / regret budget

If a line proves unfun in playtests, removing it is non-trivial — a user may already have hatched into it. Mitigation:

- Reserve `lineageId` namespace per line (`gale-*`, `stone-*` …) so deprecation can short-circuit traversal at next evolution and remap that lineage onto the closest analogous one (e.g. `static` → `ember`).
- Persist `Pet.line` and `Pet.lineageId`; the line field stays the source of truth for the *palette* even if the lineage is remapped.

## Considered Alternatives

| Option | Why not |
|---|---|
| Ship all 5 new baselines at once | 5 × 5 stages = 25 minimum new grids before any release. Solo art bandwidth doesn't support it. |
| Generate baselines procedurally | Output looks uniformly bland; defeats the collectible feel. |
| User-submitted creatures | Out of scope for a single-developer hobby project; moderation / IP burden. |

## Out of Scope / Follow-ups

- Seasonal / event-exclusive baselines (e.g. a rare egg color that only appears in December).
- A "trade" or "release" mechanic — currently `resetPet` is the only release path.
- Achievements tied to discovering N% of the evolution tree (Pokedex-style).
