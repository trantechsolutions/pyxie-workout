# ADR-0006: In-App Wiki, Exercise Coaching, and Single-CTA Layout

**Status:**   Accepted
**Date:**     2026-05-23
**Author:**   solution-architect agent
**Deciders:** Jonathan V Tran

---

## Context

Four small-to-medium UX gaps surfaced together and are best addressed in a single design pass because they share the same surfaces:

1. **No in-app wiki.** Lore, evolution-branching rules, line guide, and onboarding content live in `docs/wiki/PYXIE-WIKI.md` (588 lines). It is excellent reference material that is currently invisible to anyone who is not browsing the GitHub repo. New users have no path from "I just installed this PWA" to "I understand how the evolution branches work."
2. **Exercises lack teaching.** `Exercise.cue` (in `src/data/exercises.ts`) is one short sentence per exercise — designed for glance-during-timer use. There is nothing teaching a beginner *what the exercise actually is* before they start (e.g. "Bear Crawl" — what does that look like?). The Workout preview list shows only `name` + `45s`.
3. **Veterans get nagged.** Whatever teaching layer is added needs an off-switch — once a user knows what a "Hand Release Push-up" is, the form text becomes noise on the timer.
4. **Layout asymmetry.** `.pet-actions` is a 2-column CSS grid (`1fr 1fr`). On the hatched state it holds `[Play] [Workout]` and looks correct. In the egg state only `[Workout]` is rendered, leaving the button glued to the left column. The egg sprite itself centers via the flex `.pet-display`, but the lone CTA underneath visually unbalances the screen. The same anti-pattern lurks in `.cta-grid` (Reroll + Start) — fine today because both are always rendered, but the pattern is brittle.

All four concerns touch the same areas (`App.tsx` routing, `Nav.tsx`, `Workout.tsx`, `WorkoutTimer.tsx`, `Pet.tsx`, `styles.css`, `exercises.ts`, `settingsSlice.ts`). Bundling them means one PR, one round of snapshot updates, one trip through CI.

---

## Decision

**We will (a) add an in-app `/wiki` route that renders the existing markdown source via `react-markdown`, (b) extend `Exercise` with an optional `form` field for teaching content while keeping `cue` for at-a-glance form, (c) add `Settings.showExerciseGuide` as the off-switch for the teaching layer (cue stays always-on), and (d) replace fixed 2-column layouts with a single-or-pair pattern that centers a lone CTA.**

### (a) In-app wiki — markdown as single source of truth

- Add `'wiki'` to the `Tab` type in `src/store/types.ts`.
- Create `src/screens/Wiki.tsx`. Inside, import the markdown source via Vite's `?raw` query: `import wikiSource from '../../docs/wiki/PYXIE-WIKI.md?raw'`. Render through `react-markdown` with `remark-gfm` for tables and `mermaid` for the existing flowchart blocks (or strip mermaid fences and replace with a static fallback diagram component — simpler).
- Lazy-load the route to keep the initial bundle lean: `const Wiki = lazy(() => import('./screens/Wiki'))` in `App.tsx`, wrapped in `<Suspense>`.
- Add a "Wiki" button to `Nav`. The tab is persisted as part of `PersistedUI.tab` (already the contract for the existing tabs — no new persistence work).
- Style the rendered output via a single `.wiki-content` scope in `styles.css` matching existing typography. No content lives in JSX — only the wrapper.

### (b) Exercise teaching field

- Extend the `Exercise` interface in `src/store/types.ts`:
  ```ts
  export interface Exercise {
    name: string;
    cue: string;        // Short, glanceable. Shown on timer always.
    form?: string;      // Longer teaching text. Hidden when showExerciseGuide=false.
  }
  ```
- `form` is optional — the migration backfills it where useful (especially `hard.advanced` movements like "Pseudo Planche Push-up", "Dragon Flag Negatives") and leaves it `undefined` for self-explanatory items (e.g. "Wall Sit").
- The preview list in `Workout.tsx` gains an expander row: when `form` is present AND `showExerciseGuide` is true, the row becomes a `<details><summary>` block that reveals the form text on tap.
- `WorkoutTimer.tsx` renders the `form` text in a new `.timer-form` panel beneath `.timer-detail` (which holds `cue`), again gated on `showExerciseGuide`.
- Why split `cue` from `form`: the timer is a 45-second pressure cooker — `cue` must stay one breath of text. `form` is what you read at warmup. Conflating them either forces `cue` to bloat or `form` to truncate.

### (c) Instructions off-switch

- Add `showExerciseGuide: boolean` to `Settings` in `src/store/types.ts`, default `true` in `DEFAULT_SETTINGS`.
- Add `toggleExerciseGuide` action to `settingsSlice.ts`.
- Surface as a toggle in `src/screens/settings/SoundSection.tsx` or a new `CoachingSection.tsx` — recommend the latter because the concern is distinct from audio.
- The toggle hides `form` everywhere it renders (preview expander + timer panel). `cue` is unaffected — a single line on the timer remains for everyone.

### (d) Single-CTA layout

- Rename the 2-column CTA pattern from grid-template-columns to an explicit auto-fit:
  ```css
  .pet-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    margin-top: 10px;
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
  }
  .pet-actions--single {
    grid-template-columns: minmax(140px, 240px);
    justify-content: center;
  }
  ```
- In `Pet.tsx`, the egg branch renders `<div className="pet-actions pet-actions--single">` so the lone Workout button centers under the egg.
- Apply the same `--single` modifier to `.cta-grid` when only one CTA is visible — future-proofs against the same bug class.
- Audit the egg branch's `.pet-display` block: confirm the `EggSprite` renders at the visual center of the platform shadow. If the `.pet-platform` ellipse is offset by the `min-height: 220px` plus the bob animation envelope, normalize by setting `top: 50%; transform: translate(-50%, -50%)` on the sprite wrapper, or by anchoring the sprite to the platform's vertical center rather than to the flex parent.

---

## Consequences

### Positive

- **One wiki source of truth.** Repo browsers and in-app users read the same content. The drift bug class ADR-0005 killed for sprites stays killed for prose.
- **Teaching layer is opt-in by behaviour, opt-out by setting.** New users see form text; veterans hide it once. Default-on means the toggle is discoverable by need, not by surprise.
- **`cue` keeps its purpose.** No truncation, no conditional rendering of the timer's one-line hint. The pressure-cooker UX stays clean.
- **Centering bug fixed for *all* single-CTA cases, not just the visible one.** `auto-fit` + a `--single` modifier removes the entire bug class.
- **No new persistence.** `tab: 'wiki'` rides existing `PersistedUI.tab`; `showExerciseGuide` rides existing `Settings`. Save migration is non-breaking (missing field → default true).

### Negative / trade-offs

- **New dependency: `react-markdown` + `remark-gfm` (+ optional mermaid renderer).** ~25KB gzipped together, lazy-loaded behind the wiki route. Acceptable but worth measuring against the existing bundle budget — if the project has a Lighthouse target, run it before/after.
- **Mermaid blocks in the wiki.** Two options: (1) ship `mermaid` lazily inside the Wiki screen (~120KB but still lazy), (2) pre-render mermaid at build-time into inline SVG via a vite plugin, (3) replace fenced ` ```mermaid ` blocks with static fallback paragraphs in the in-app render path. Recommend option 3 for v1 — graphs are nice-to-have, not load-bearing.
- **`form` backfill is authoring work.** ~90 exercises × maybe 2 sentences each = a couple of evenings. Not all need it. Phase the migration: ship the schema + UI with `form` undefined everywhere, then PR the content in tranches.
- **Save-shape change.** `Settings.showExerciseGuide` is a new field. Hydration must default missing → true. The existing settings hydration logic in `usePersistenceLifecycle` already merges over `DEFAULT_SETTINGS`, so this is automatic — but write a regression test.
- **CSS layout change risks visual regressions.** The `auto-fit` pattern behaves slightly differently from `1fr 1fr` at very narrow widths. The roster-render snapshot tests catch sprite output but not CTA layout. Add one visual smoke test (existing component test that mounts `Pet` with `workoutsToHatch > 0` and asserts the Workout button is centered in its parent).

---

## Alternatives considered

### Alternative: re-author wiki content as native React panels
**Considered because:** No new dependency; type-checked content; consistent styling without escape hatches.
**Rejected because:** 588 lines of content. Duplicating it into JSX guarantees drift with the GitHub-rendered version. The drift class is the exact bug ADR-0005 spent three cycles eliminating for sprites — repeating it for prose is regressive.

### Alternative: ship the wiki as a static `<iframe>` to a hosted HTML render
**Considered because:** Zero JS dependency on the client.
**Rejected because:** Requires a hosting target, breaks offline PWA usage, and hands the user a context-switch (the iframe scrolls separately, doesn't honor app theme, doesn't get the Pyxie-Sans typeface). The wiki should feel like part of the app, not a link out.

### Alternative: roll the teaching content into `cue` and just make `cue` longer
**Considered because:** One field; no schema change.
**Rejected because:** Different read contexts demand different lengths. The timer is glance-while-moving (one short line). The pre-workout preview is read-at-rest (a paragraph is fine). Forcing one field to serve both leads to either timer-text bloat or preview-text starvation.

### Alternative: tri-state instructions toggle (always / preview-only / never)
**Considered because:** Some users may want the preview teaching but not timer-time distraction.
**Rejected because:** Bordering on over-design for v1. A boolean covers the stated user need ("turn off once familiar"). If usage data shows a real preference for "preview-only", upgrade to tri-state in a follow-up — additive, no migration.

### Alternative: hard-fix the egg layout only; defer the `.pet-actions` rework
**Considered because:** Smallest possible change for the visible bug.
**Rejected because:** Bug class, not bug instance. Any future single-CTA state (e.g. Dead screen, a future "claim reward" prompt) repeats the same misalignment. One-line modifier solves it for all callers.

---

## Implementation notes

- **Markdown loader:** Vite's `?raw` query suffix loads file contents as a string at build time. No runtime fetch, works offline, ships in the lazy chunk. Vite is already the bundler.
- **Mermaid handling:** v1 detects `mermaid` code fences in the markdown and replaces with a styled `<div class="mermaid-fallback">` containing the alt text. Authoring guideline added to the wiki: keep mermaid blocks self-explanatory in their preceding paragraph.
- **Default export of `form` text:** start with the *advanced* tier — beginners learn movements visually elsewhere; advanced movements (e.g. "Dragon Flag Negatives", "Pseudo Planche Push-up", "L-sit (knees ok)") benefit most from a 2-sentence form description.
- **Settings persistence:** missing `showExerciseGuide` after hydration → default `true`. Add a slice test asserting the merge behavior so future schema changes don't silently flip the default.
- **CSS modifier convention:** `.pet-actions--single` follows BEM-ish naming the project doesn't currently use systematically. If the maintainer prefers, switch to `.pet-actions.is-single` — purely cosmetic.
- **Nav order:** recommend `pet · workout · wiki · settings`. Wiki sits between workout and settings because users discover it via "how does this work?" right after their first workout.
- **Visual regression coverage:** add one new component test in `tests/components.test.tsx` that mounts `Pet` in egg state and asserts the lone CTA's parent has `pet-actions--single` class. Cheap, prevents regression on the bug we're fixing.

---

## Implementation milestones (handoff)

### Milestone 1 — Layout fix (smallest, highest visible payoff)
**Goal:** Egg screen visually balanced; lone Workout button centered.
**Tasks:**
- Update `.pet-actions` rule in `src/styles.css` to the `auto-fit` pattern documented above.
- Add `.pet-actions--single` modifier.
- In `Pet.tsx` egg branch, apply the modifier.
- Verify EggSprite centering on the platform (adjust `.pet-display` flex if needed).
- Apply same modifier pattern to `.cta-grid` for future-proofing.
- Add component test asserting modifier class is present in egg state.
**Handoff:** Visual smoke test passes; existing 490 tests stay green.

### Milestone 2 — Settings toggle plumbing
**Goal:** `showExerciseGuide` exists end-to-end, defaults true, persists.
**Tasks:**
- Extend `Settings` type with `showExerciseGuide: boolean`.
- Update `DEFAULT_SETTINGS` in `src/data/constants.ts`.
- Add `toggleExerciseGuide` to `settingsSlice.ts`.
- Add UI control (recommend new `src/screens/settings/CoachingSection.tsx`, slot into `Settings.tsx`).
- Slice test for the toggle + hydration default-merge.
**Handoff:** Setting toggles, persists across reloads, defaults true on fresh installs.

### Milestone 3 — Exercise `form` field + render gating
**Goal:** Schema extended; renderers gated on the toggle.
**Tasks:**
- Add `form?: string` to `Exercise` interface.
- Update `Workout.tsx` preview list to render `<details>` expander when `form` && `showExerciseGuide`.
- Update `WorkoutTimer.tsx` to render `.timer-form` panel under `.timer-detail` when `form` && `showExerciseGuide`.
- Style `.timer-form` and the preview expander in `styles.css`.
- No content backfill yet — schema-only ships green because `form` is optional.
**Handoff:** With toggle on and `form` populated, content renders in both views; with toggle off, content hidden everywhere.

### Milestone 4 — Wiki route
**Goal:** `/wiki` tab renders the markdown source in-app.
**Tasks:**
- Install `react-markdown` and `remark-gfm`.
- Add `'wiki'` to `Tab` type; route in `App.tsx`; entry in `Nav`.
- Create `src/screens/Wiki.tsx` — lazy chunk, `import wikiSource from '../../docs/wiki/PYXIE-WIKI.md?raw'`.
- Mermaid-block fallback: regex-replace ` ```mermaid ... ``` ` with a styled `<div>` showing the alt text.
- Wiki content styles in `styles.css` under a single `.wiki-content` scope.
- Smoke test: render Wiki, assert one known heading from the MD is present.
**Handoff:** Tab visible in nav, content renders, no console warnings, lazy chunk verified in build output.

### Milestone 5 — Content backfill (`form` text)
**Goal:** Form text populated where it teaches the most.
**Tasks:**
- Author `form` strings for `hard.advanced` (10 exercises) first.
- Then `hard.intermediate` and `medium.advanced` (20).
- Then the remainder, opportunistically.
**Handoff:** Phased — no single PR blocks the others.

---

## References

- [ADR-0001: Persist middleware](./0001-persist-middleware.md)
- [ADR-0002: Egg / hatch blind-box](./0002-egg-hatch-blindbox.md)
- [ADR-0003: Evolution tree](./0003-evolution-tree.md)
- [ADR-0004: Baseline roster expansion](./0004-roster-expansion.md)
- [ADR-0005: Procedural sprite system & roster scaling contract](./0005-procedural-sprite-system.md)
- Existing wiki source: `docs/wiki/PYXIE-WIKI.md`
