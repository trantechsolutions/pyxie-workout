# ADR-0005: Procedural Sprite System & Roster Scaling Contract

**Status:**   Accepted
**Date:**     2026-05-23
**Author:**   solution-architect agent
**Deciders:** Jonathan V Tran

> Saved at `docs/adr/` to match the project's existing ADR convention (the skill-default `docs/architecture/decisions/` is not used in this repo).

---

## Context

The sprite system renders 248 creatures across 8 lines as 16×16 character grids interpreted into SVG `<rect>` elements at runtime (`Sprite.tsx`). Each line ships a palette of 8 colors, of which indices 1–6 are line-tunable and indices 7/8 are silently reserved for white/black highlights by `Sprite.tsx`. Grids are authored in two places — `CREATURES[line][stage]` (the legacy 3×5 linear spine) and `EVOLUTION_TREE[lineageId].grid` (the 248-node tree from ADR-0003) — with `resolveGrid` walking a three-tier fallback chain to merge them at read time.

ADR-0004 has just shipped 5 new baselines (gale, stone, umbra, aurora, static), bringing the roster to 8 lines × 31 nodes. The ADR-0004 follow-ups explicitly call out two design debts: `withLeafFlourish` produces a palette collision on `static` (cream highlight vs yellow body), and `EggSprite` flecks were not extended uniformly across the new lines. The user has indicated the roster ceiling could grow further. Adding a 9th line today requires editing at least 6 files (`PALETTES`, `CREATURES`, `LINE_INFO`, `HATCHABLE_BASELINES`, `EGG_GRID`, `EVOLUTION_TREE`), with no compile-time enforcement of the palette/grid invariants and no mechanism to regenerate the 248 documentation SVGs in `docs/wiki/sprites/` from the same source the runtime uses — meaning the wiki drifts silently from the app on every grid edit.

The 248 wiki sprites are uncommitted and were produced by a one-shot export with no script in the repo, confirming the drift risk is already realized.

---

## Decision

**We will consolidate sprite authoring behind a single typed contract, lift procedural transforms into a composable pipeline, and add a build-time validator plus a documentation-export script that share the same renderer the runtime uses.**

The contract makes a "line" a single object — palette, baseline grid, line metadata, and egg-fleck definition co-located — so adding a 9th line is a one-file change. The runtime renderer becomes a pure function `(grid, palette, transforms[]) → SvgNode[]`, callable from both React (`Sprite.tsx`) and a Node script (`scripts/export-sprites.ts`) that regenerates `docs/wiki/sprites/`. A Vitest-based validator runs in CI to enforce grid shape (16×16, allowed chars only), palette length and reserved-index invariants, and transform-output safety (no palette collisions).

The dual source of truth is collapsed: `CREATURES[line][stage]` is deprecated in favor of `EVOLUTION_TREE` as the sole runtime store, with the legacy spine retained only as a migration helper for pre-tree saves (already its only real purpose post-ADR-0003).

---

## Consequences

### Positive consequences

- **Adding a new line touches 1 file.** A `LineDefinition` object encapsulates palette, baseline grid, metadata, egg-fleck char + color, and lineage namespace. `HATCHABLE_BASELINES`, `LINE_INFO`, `PALETTES`, and `EGG_GRID` become derived from the registry, not parallel maps to keep in sync.
- **Documentation parity is enforced by construction.** `npm run export:sprites` regenerates `docs/wiki/sprites/` from the same renderer the runtime uses; CI fails if the export diff is non-empty. The drift class of bug becomes impossible, not merely unlikely.
- **Palette/grid invariants become compile- or test-time errors, not visual ones.** Typed `Palette = readonly [string, string, string, string, string, string]` (length-6, with white/black injected by the renderer) eliminates the implicit `7`/`8` reservation. A grid type-guard rejects malformed strings before they hit the screen.
- **Transforms compose.** `withLeafFlourish` becomes one entry in a `GridTransform[]` pipeline. Adding new procedural effects (seasonal recolors, evolved-form glow, art-pending visual differentiation) is additive and individually testable. The `static` collision is solvable inside the transform without touching the call sites.
- **Removes one of the two sprite truth sources.** `resolveGrid`'s three-tier fallback collapses to a single tree lookup with a procedural ancestor-walk for art-pending nodes.

### Negative consequences / trade-offs

- **Migration touches every line definition.** All 8 current lines must be rewritten into the registry format. Estimated effort: ~half a day, mostly mechanical, fully covered by snapshot tests against the current rendered output (no visual regression permitted).
- **The Node-side renderer must avoid React.** `Sprite.tsx` currently returns JSX; the shared core must instead emit a neutral intermediate (e.g. `{ x, y, w, h, fill }[]`) that both a React wrapper and a Node SVG serializer consume. Mildly more indirection in the hot rendering path; negligible runtime cost given grid size.
- **CI gains a new gate.** The export-parity check adds ~1–2 seconds and a new failure mode reviewers must learn ("regenerate wiki SVGs"). Mitigated by a `pre-commit` hook that runs the export automatically.
- **Deprecating `CREATURES` requires a save-migration audit.** Any persisted state referencing `{ line, stage }` without a `lineageId` must continue to resolve through `legacyLineageId()` (already exists). This is a constraint on the deprecation, not a new risk.
- **The 248 uncommitted wiki SVGs become regenerable garbage.** Commit-or-delete decision needed: recommend deleting them and regenerating from the new script in the same PR, so git history reflects only authored grids, not exported artifacts.

---

## Alternatives considered

### Alternative: Leave the system as-is and document the conventions
**Why it was considered:** The system works today; ADR-0004 just shipped 8 lines successfully under the current model.
**Why it was rejected:** The user has signaled roster growth. Each new line currently requires 6+ file edits with no compile-time enforcement, and the wiki-drift problem is already realized in the uncommitted SVG dump. Postponing the consolidation pushes the cost forward and increases the size of the eventual migration.

### Alternative: Move to authored SVG assets (Figma/Aseprite export pipeline)
**Why it was considered:** Procedural pixel grids are unusual; most pet-collector games ship hand-authored sprite atlases.
**Why it was rejected:** The grid format *is* the design identity of this product — readable in code review, diffable in git, modifiable in a text editor without art tooling. Replacing it with binary assets sacrifices the solo-developer workflow advantage that ADR-0004 explicitly depends on. Per-pet hue rotation also becomes much harder against a baked PNG.

### Alternative: Generate grids fully procedurally from palette + archetype
**Why it was considered:** Already noted in ADR-0004 as the "uniformly bland" trap; revisiting because a partial version (palette-driven transforms over a shared skeleton) might be tractable.
**Why it was rejected:** ADR-0004 documents this trade-off correctly — collectible distinctiveness comes from authored grids, not synthesis. A *transform pipeline over authored grids* (this ADR's recommendation) keeps the authored-distinctiveness while permitting bounded procedural variation. Full procedural generation remains rejected for the reasons ADR-0004 already gave.

### Alternative: Migrate only the registry consolidation; defer the renderer split and CI gate
**Why it was considered:** Smaller PR, faster delivery, addresses the worst pain point (multi-file line additions).
**Why it was rejected:** The wiki-drift problem is independent and equally cheap to solve in the same pass. Splitting the work means a second migration touching the same files within months. Bundling is the lower-total-cost path.

---

## Implementation notes

- **Shared renderer shape:** core is `renderGrid(grid: Grid, palette: Palette, transforms?: GridTransform[]) → RenderedRect[]`. React wrapper wraps `RenderedRect[]` into `<rect>` JSX; Node wrapper serializes to standalone `.svg` strings.
- **Grid type:** brand the grid string array with a parse function — `parseGrid(raw: string[]): Grid` throws on shape/char violations. All registry entries pass through this at module load, so invalid grids fail import in dev/test rather than rendering blank in prod.
- **Palette type:** `readonly [string, string, string, string, string, string]` (length-6 tuple). White (`#ffffff`) and black (`#0a0a0a`) are renderer constants, no longer in palette arrays.
- **Registry shape:** `LINE_REGISTRY: Record<Line, LineDefinition>` where `LineDefinition = { label, tagline, palette, baselineGrid, eggFleck: { char, color }, lineageNamespace, hatchable }`. Existing maps become `Object.fromEntries(Object.entries(LINE_REGISTRY).map(...))` derivations.
- **Export script:** `scripts/export-sprites.ts` walks `EVOLUTION_TREE`, calls the shared renderer, writes one `.svg` per authored node to `docs/wiki/sprites/<lineageId>.svg`. Art-pending nodes are skipped (no placeholder export — wiki shows authored-only).
- **CI gate:** `npm run export:sprites && git diff --exit-code docs/wiki/sprites/`. Fails the build if regeneration produces a diff.
- **Migration order is non-negotiable:** registry first (additive, no breakage), then renderer extraction (refactor under snapshot tests), then export script + CI gate (drift-prevention), then `CREATURES` deprecation (last, after all consumers migrated).

---

## References

- [ADR-0001: Persist middleware](./0001-persist-middleware.md)
- [ADR-0002: Egg / hatch blind-box](./0002-egg-hatch-blindbox.md)
- [ADR-0003: Evolution tree](./0003-evolution-tree.md)
- [ADR-0004: Baseline roster expansion](./0004-roster-expansion.md)
