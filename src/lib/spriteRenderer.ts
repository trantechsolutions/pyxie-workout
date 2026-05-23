// ADR-0005: Shared sprite renderer.
//
// `renderGrid` is a pure function `(grid, palette, transforms?) → RenderedRect[]`
// used by both the React `<Sprite/>` component and the Node-side
// `scripts/export-sprites.ts` script. Keeping a single rendering path
// eliminates the drift class of bug between the runtime UI and the wiki docs.

import {
  type Grid,
  type Palette,
  PALETTE_BLACK,
  PALETTE_WHITE,
  parseGrid,
} from '../data/lineRegistry';

// -----------------------------------------------------------------------------
// Color utilities (palette collision detection).
// -----------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Squared Euclidean distance in sRGB space between two #rrggbb colors. Cheap
 * proxy for "are these visually distinguishable on a 16×16 sprite cell?".
 * Mirrors the metric used by the registry's collision validator
 * (tests/lineRegistry.test.ts) so the renderer's collision-avoidance and the
 * test's collision-detection cannot drift out of agreement.
 */
function rgbDistanceSq(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return Number.POSITIVE_INFINITY;
  return (ra[0] - rb[0]) ** 2 + (ra[1] - rb[1]) ** 2 + (ra[2] - rb[2]) ** 2;
}

// RGB squared-distance threshold below which slot-4 (crown) is treated as
// indistinguishable from slot-2 (light body) and the crown falls back to
// slot-5 (deep shadow). Held in sync with VISUAL_COLLISION_THRESHOLD_SQ in
// tests/lineRegistry.test.ts — the registry validator is the contract.
//
// Lines flagged at this threshold (slot4↔slot2 squared distance):
//   static 348  ← documented collision (ADR-0005 follow-up #7)
//   gale   621  ← cycle-3 escalation
// All other lines sit well above 900.
const RGB_COLLISION_THRESHOLD_SQ = 900;

export interface RenderedRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

/**
 * A composable grid transform: takes a `Grid` and returns a new `Grid`.
 * Transforms are applied in order before the grid is rasterized into rects.
 */
export type GridTransform = (grid: Grid) => Grid;

export interface RenderOptions {
  /** Total pixel size (square). Defaults to 16 so 1 cell = 1 pixel. */
  size?: number;
  /** Slight overlap added to each rect's width/height to hide subpixel seams. */
  overlap?: number;
  /** Optional fallback color when a char references a palette slot that's missing. */
  fallback?: string;
}

const DEFAULT_OVERLAP = 0.5;
const DEFAULT_FALLBACK = '#888';

/**
 * Translate a single grid char to a fill color.
 *   '1'–'6' → palette[ch-1]
 *   '7'     → renderer-constant white (eye highlight)
 *   '8'     → renderer-constant black (eye pupil / outline)
 */
function charToFill(ch: string, palette: Palette, fallback: string): string | null {
  if (ch === '.') return null;
  if (ch === '7') return PALETTE_WHITE;
  if (ch === '8') return PALETTE_BLACK;
  const idx = ch.charCodeAt(0) - '1'.charCodeAt(0);
  if (idx < 0 || idx > 5) return fallback;
  return palette[idx] ?? fallback;
}

/**
 * Rasterize a validated 16×16 grid against a palette into an array of
 * `RenderedRect`. Empty cells (`.`) are skipped.
 */
export function renderGrid(
  grid: Grid,
  palette: Palette,
  transforms: readonly GridTransform[] = [],
  options: RenderOptions = {},
): RenderedRect[] {
  const size = options.size ?? 16;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;
  const fallback = options.fallback ?? DEFAULT_FALLBACK;
  const cell = size / 16;

  let working: Grid = grid;
  for (const t of transforms) working = t(working);

  const rects: RenderedRect[] = [];
  for (let y = 0; y < 16; y++) {
    const row = working[y];
    for (let x = 0; x < 16; x++) {
      const fill = charToFill(row[x], palette, fallback);
      if (fill === null) continue;
      rects.push({
        x: x * cell,
        y: y * cell,
        w: cell + overlap,
        h: cell + overlap,
        fill,
      });
    }
  }
  return rects;
}

// -----------------------------------------------------------------------------
// Built-in transforms.
// -----------------------------------------------------------------------------

function overlayCell(rows: string[][], y: number, x: number, ch: string): void {
  if (y < 0 || y > 15 || x < 0 || x > 15) return;
  if (rows[y][x] === '.') rows[y][x] = ch;
}

/**
 * Pick the palette slot used by `withLeafFlourish('p')` (the "crown").
 *
 * Conceptually the crown wants to be the cream "highlight" slot (slot 4 →
 * char '5'). That works for 6 of the 8 shipped lines. On the remaining two
 * (gale, static) slot 4 is so close in RGB space to either the light body
 * mid-tone (slot 2) or the renderer-white eye fill (#ffffff) that the crown
 * disappears. On dark lines (umbra, static palette extremes) the deep-shadow
 * fallback (slot 5 → char '6') also collides — this time against the
 * renderer-black eye-pupil fill (#0a0a0a).
 *
 * Implementation: score every palette slot by its minimum RGB-squared-
 * distance to the set of "things the crown must read against" (slot 2, both
 * renderer constants, and slot 0 — the primary body fill). Pick the slot
 * with the largest min-distance, so the crown is always the most-contrasting
 * available swatch for the line. Generic, data-driven, no hardcoded line
 * branches — new lines self-resolve.
 *
 * Uses the same RGB metric as the registry validator
 * (tests/lineRegistry.test.ts, invariant #6) so renderer and contract cannot
 * drift apart.
 */
const CROWN_PREFERRED_SLOT = 4; // slot 4 (highlight) when not colliding
function pickCrownChar(palette: Palette | undefined): string {
  if (!palette) return '5';
  const contrastTargets: string[] = [
    palette[2],     // light body — sits directly under the crown row
    palette[0],     // primary body fill — most common silhouette color
    PALETTE_WHITE,  // renderer-constant eye highlight (char '7')
    PALETTE_BLACK,  // renderer-constant eye pupil   (char '8')
  ].filter(Boolean);
  // Prefer the cream highlight slot when it is safely distant from every
  // contrast target. Otherwise pick the slot with the maximum minimum
  // distance to the contrast set — the most visually distinct option.
  const preferred = palette[CROWN_PREFERRED_SLOT];
  if (preferred) {
    const minDist = Math.min(...contrastTargets.map((c) => rgbDistanceSq(preferred, c)));
    if (minDist > RGB_COLLISION_THRESHOLD_SQ) {
      return String.fromCharCode('1'.charCodeAt(0) + CROWN_PREFERRED_SLOT);
    }
  }
  let bestIdx = CROWN_PREFERRED_SLOT;
  let bestScore = -1;
  for (let i = 0; i < palette.length; i++) {
    const slot = palette[i];
    if (!slot) continue;
    const minDist = Math.min(...contrastTargets.map((c) => rgbDistanceSq(slot, c)));
    if (minDist > bestScore) {
      bestScore = minDist;
      bestIdx = i;
    }
  }
  return String.fromCharCode('1'.charCodeAt(0) + bestIdx);
}

/**
 * `withLeafFlourish` — overlays a small "ascension" marker onto a stage-3
 * silhouette so the stage-4 leaf reads as a final form rather than an
 * identical reskin.
 *   - suffix='p' → soft crown across head row (palette slot 4, or slot 5 as
 *                  collision-avoidance fallback when slot 4 ≈ body color)
 *   - suffix='a' → angular shadow spikes at the feet (palette slot 3)
 *
 * Optional `palette` is used purely to detect the slot-4↔slot-2 collision and
 * select a contrasting alternative; call sites that don't pass it get the
 * legacy slot-4 behavior.
 */
export function withLeafFlourish(suffix: 'p' | 'a', palette?: Palette): GridTransform {
  const crownChar = suffix === 'p' ? pickCrownChar(palette) : '4';
  return (grid: Grid): Grid => {
    const rows = grid.map((r) => r.split(''));
    if (suffix === 'p') {
      for (const x of [5, 7, 9, 10]) overlayCell(rows, 0, x, crownChar);
      overlayCell(rows, 1, 4, crownChar);
      overlayCell(rows, 1, 11, crownChar);
    } else {
      for (const x of [2, 3, 12, 13]) overlayCell(rows, 15, x, crownChar);
      overlayCell(rows, 14, 1, crownChar);
      overlayCell(rows, 14, 14, crownChar);
    }
    return parseGrid(rows.map((r) => r.join('')), `leafFlourish:${suffix}`);
  };
}

/**
 * Serialize a `RenderedRect[]` plus a viewBox into a standalone SVG document
 * string. Used by the export script; React consumers map rects directly to JSX.
 */
export function rectsToSvg(rects: readonly RenderedRect[], size: number): string {
  const header = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">`;
  const body = rects
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`)
    .join('');
  return `${header}${body}</svg>`;
}
