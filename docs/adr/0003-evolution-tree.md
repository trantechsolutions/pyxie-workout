# ADR-0003 — Branching Evolution Tree (Phase 2)

- Status: Accepted (implemented 2026-05-23 — Phase 2.0 ships system + 3 net-new sprites; remaining nodes render via placeholder)
- Date: 2026-05-23
- Authors: Jonathan V Tran

## Context

ADR-0002 introduced `Pet.workoutCounts` which tally completed workouts by `intensity` (easy/medium/hard) and `complexity` (beginner/intermediate/advanced). Today these are written but unused. Stage transitions remain linear: `CREATURES[line][stage]` indexed off `pet.stage`.

The user has asked for branching evolution: at each evolution threshold the creature should pick one of two children based on the player's workout profile, expanding the roster combinatorially over a 30-day cycle.

## Decision

Introduce a tree-shaped evolution data structure with two branches per node, selected by the dominant ratio of a configured *branch axis* (intensity vs complexity). The legacy `CREATURES[line][stage]` array remains as a rendering catalog but is no longer the source of truth for what comes next.

### Data model

```ts
// src/data/evolutionTree.ts
export type BranchAxis = 'intensity' | 'complexity';

export interface EvolutionNode {
  id: string;                       // 'ember-base' | 'ember-base-warrior' | …
  name: string;                     // display name
  line: Line;                       // palette + sprite line
  stage: number;                    // 0..4
  branchAxis: BranchAxis | null;    // null if this is a final (stage 4) node
  // Each child id points to another EvolutionNode. `primary` is selected when
  // the dominant bucket on `branchAxis` is the LEFT half of the ordered tuple
  // (easy/beginner side), `alt` for the RIGHT half (hard/advanced side).
  children: { primary: string; alt: string } | null;
}

export const EVOLUTION_TREE: Record<string, EvolutionNode>;
```

`Pet` gains a single new persisted field:
```ts
lineageId: string;  // current node id in EVOLUTION_TREE
```

Existing pets without a `lineageId` migrate to a synthetic id derived from `(line, stage)` so they slot into the primary spine.

### Branch selection rule

At evolution time:
1. Look up `node = EVOLUTION_TREE[pet.lineageId]`.
2. If `node.children === null`, no evolution (final form).
3. Else read `pet.workoutCounts[node.branchAxis]`. The bucket with the highest count chooses the child:
   - `intensity`: `{ easy, medium }` → primary, `{ hard }` → alt. (Medium-dominant routes are intentionally biased toward the "balanced" branch; ties broken in favor of primary so a fresh hatch resolves deterministically.)
   - `complexity`: `{ beginner }` → primary, `{ intermediate, advanced }` → alt.
4. Set `pet.lineageId = children[selected]`, increment `pet.stage`.

### Rendering

`Sprite` resolves art via the lineage node:
- If `EVOLUTION_TREE[id].grid` exists, render normally.
- Else render a **procedural placeholder**: take the line's `PALETTES`, draw a silhouette generated from the parent node's grid recolored with a desaturation matrix and a small badge marking it as "art pending". This lets the system ship before all 49 grids are authored.

### Tree skeleton

```
                 ┌─── ember-base ──────┬── ember-blaze (alt)
egg →            │   (axis: intensity) │   (axis: complexity) ──┐
randomly ──┬─────┤                     └── ember-warmth (primary)│ … (4 levels deep)
           ├──── tide-base   (same pattern)                       │
           └──── verdant-base (same pattern)                      │
                                                                  ▼
                                                          24 stage-4 finals
```

Total nodes when fully populated: `3 + 6 + 12 + 24 + 48 = 93` (full binary branching across all five stages, 31 nodes per baseline line). This implementation keeps stage-4 branching to preserve the "every habit profile produces a distinct final form" promise. Authoring effort is one 16×16 pixel grid per node; most playthroughs render fewer than 5 (one per stage along the user's actual path).

## Considered Alternatives

| Option | Why not |
|---|---|
| Workout-type milestones (10 hard → unlocks Brute) | Less surprising; user can game it. The ratio approach makes branches a *consequence* of habits, not a checklist. |
| Random branch selection | Removes player agency; no reason to vary workout style. |
| 3+ children per node | Tree explodes to 3^4 = 81 stage-4 forms. Art cost is prohibitive for a solo project. |

## Risks

- **Art debt.** 45 new sprites is a real backlog. Procedural placeholders mitigate but do not solve.
- **Branch fairness.** A user who always picks `medium/beginner` only ever sees the primary spine. Acceptable — the variety reward is for varied workouts.
- **Persistence churn.** Adding `lineageId` requires the hydrate migration to synthesize an id from legacy `(line, stage)` pairs; misspelling node ids would soft-corrupt save data. Mitigate with a `lineageId` validator in `migratePet` that falls back to `${line}-base` and clamps stage.

## Migration Plan

1. Land `evolutionTree.ts` with the full 48-node skeleton, names only, `grid: null` for non-baseline nodes.
2. Add `pet.lineageId` to `Pet` + `migratePet`.
3. Replace `applyWorkoutResult`'s stage++ logic with a tree traversal.
4. Update `Sprite` to fall back to procedural placeholders when `grid == null`.
5. Update `Pet.tsx` stage label to display `node.name` instead of `LINE_INFO[line].label`.
6. Backfill grids one branch family at a time; each PR adds a few sprites.

Estimated 8-12 files modified, 1 new file, 1 deleted (the old `CREATURES[line][stage]` lookup can stay during transition and be removed once all nodes have grids).

## Out of Scope / Follow-ups

- Roster expansion beyond ember/tide/verdant baselines → ADR-0004.
- Showing the evolution tree as a Pokedex-style discovery UI.
- Re-rolling lineage via a paid/earned item.
