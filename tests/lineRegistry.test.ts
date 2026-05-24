// ADR-0005 AC #8 — Registry invariant validator suite.
//
// This file is the canonical contract document for `LINE_REGISTRY`. If a future
// contributor adds a new line (or mutates an existing one), the assertions
// below should be the first thing they read to understand what the registry
// guarantees to the renderer, the egg sprite, and the lineage system.
//
// Invariants enforced (numbered to match ADR-0005 dispatch):
//   1. palette is exactly 6 well-formed #rrggbb hex strings.
//   2. baselineGrid is a renderable 16×16 grid (parseGrid accepts it; chars
//      come from the renderer's allowed alphabet).
//   3. Reserved renderer constants ('#ffffff' white, '#0a0a0a' black) NEVER
//      appear inside any line's `palette` array — they live in the renderer,
//      not the registry. (This is the legacy bug class the refactor killed.)
//   4. eggFleck.char is exactly one character, NOT a palette index ('1'–'6')
//      or a reserved renderer char ('.', '7', '8'), AND is unique across
//      lines, AND is present in the shared EGG_GRID.
//   5. lineageNamespace is unique across lines.
//   6. Applying every registered `GridTransform` (currently just
//      `withLeafFlourish` p/a) to each line's baseline grid does not produce
//      a rendered output where the transform's newly-introduced fill is
//      visually indistinguishable from an existing body fill in the same
//      sprite. The transform must be built with the owning line's palette so
//      the renderer's palette-aware collision-avoidance is exercised.
//   7. Derived exports (`PALETTES`, `LINE_INFO`, `HATCHABLE_BASELINES`) are
//      deep-equal to a fresh re-derivation from `LINE_REGISTRY`.

import { describe, it, expect } from 'vitest';
import {
  LINE_REGISTRY,
  HATCHABLE_BASELINES,
  ALL_LINES,
  PALETTES,
  LINE_INFO,
  parseGrid,
  PALETTE_WHITE,
  PALETTE_BLACK,
  type Palette,
} from '../src/data/lineRegistry';
import {
  renderGrid,
  withLeafFlourish,
  type GridTransform,
} from '../src/lib/spriteRenderer';
import { EGG_GRID } from '../src/data/eggGrid';
import type { Line } from '../src/store/types';

// -----------------------------------------------------------------------------
// Helpers.
// -----------------------------------------------------------------------------

const HEX_RGB = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_GRID_CHARS = new Set(['.', '1', '2', '3', '4', '5', '6', '7', '8']);
const RESERVED_RENDERER_HEX = new Set([
  PALETTE_WHITE.toLowerCase(),
  PALETTE_BLACK.toLowerCase(),
]);

const LINES = Object.keys(LINE_REGISTRY) as Line[];

// Inventory of every char present in the shared EGG_GRID. EggSprite and this
// test both import the same source (`src/data/eggGrid.ts`) so drift is
// impossible — the assertion below catches lines whose fleck char isn't
// actually placed on the egg.
const EGG_GRID_CHARS_PRESENT = new Set(EGG_GRID.join('').split(''));

/** Parse #rrggbb into [r,g,b] 0–255. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Squared Euclidean distance in RGB space. Cheap proxy for "are these two
 * hex colors visually distinguishable on a tiny sprite cell?". A threshold
 * of <= 900 (≈30 per channel) catches near-identical creams/yellows that
 * read as one continuous blob on a 16×16 pixel art sprite.
 */
function rgbDistanceSq(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}
const VISUAL_COLLISION_THRESHOLD_SQ = 900;

// All transform *factories* the registry currently has to consider. Built
// per-line with that line's palette so the renderer's palette-aware
// collision-avoidance (see `pickCrownChar` in spriteRenderer.ts) is exercised
// the same way it runs in production. When a new transform is added to
// `spriteRenderer.ts`, append it here so the collision check picks it up.
const TRANSFORM_FACTORIES: ReadonlyArray<{ name: string; build: (palette: Palette) => GridTransform }> = [
  { name: 'withLeafFlourish(p)', build: (palette) => withLeafFlourish('p', palette) },
  { name: 'withLeafFlourish(a)', build: (palette) => withLeafFlourish('a', palette) },
];

// -----------------------------------------------------------------------------
// Invariant #1 — palette length, shape, hex validity.
// -----------------------------------------------------------------------------

describe('LINE_REGISTRY · palette shape (invariant #1)', () => {
  it.each(LINES)('%s palette is exactly 6 entries', (line) => {
    const p = LINE_REGISTRY[line].palette as readonly string[];
    expect(p).toHaveLength(6);
  });

  it.each(LINES)('%s palette entries are all #rrggbb hex', (line) => {
    for (const [i, c] of LINE_REGISTRY[line].palette.entries()) {
      expect(c, `${line}.palette[${i}] = ${c}`).toMatch(HEX_RGB);
    }
  });

  it.each(LINES)('%s palette entries are pairwise distinct', (line) => {
    const p = LINE_REGISTRY[line].palette.map((c) => c.toLowerCase());
    const unique = new Set(p);
    expect(unique.size, `duplicate palette entry in ${line}: ${p.join(',')}`).toBe(p.length);
  });

  it.each(LINES)('%s swatch is a well-formed #rrggbb hex', (line) => {
    expect(LINE_REGISTRY[line].swatch).toMatch(HEX_RGB);
  });
});

// -----------------------------------------------------------------------------
// Invariant #2 — baselineGrid shape + renderer alphabet.
// -----------------------------------------------------------------------------

describe('LINE_REGISTRY · baselineGrid shape (invariant #2)', () => {
  it.each(LINES)('%s baselineGrid is 16×16 and parseGrid-clean', (line) => {
    const g = LINE_REGISTRY[line].baselineGrid;
    expect(g).toHaveLength(16);
    for (let y = 0; y < 16; y++) {
      expect(g[y]).toHaveLength(16);
    }
    // Round-trip through parseGrid — it threw at module load if invalid, but
    // we re-run it here to make the contract explicit in the test file.
    expect(() => parseGrid(g, `${line}-baseline`)).not.toThrow();
  });

  it.each(LINES)('%s baselineGrid only uses the renderer alphabet', (line) => {
    const g = LINE_REGISTRY[line].baselineGrid;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const ch = g[y][x];
        expect(
          ALLOWED_GRID_CHARS.has(ch),
          `${line} baselineGrid char '${ch}' at (${x},${y}) not in renderer alphabet`,
        ).toBe(true);
      }
    }
  });

  it.each(LINES)('%s baselineGrid rasterizes to a non-empty rect set', (line) => {
    const rects = renderGrid(LINE_REGISTRY[line].baselineGrid, LINE_REGISTRY[line].palette);
    expect(rects.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// Invariant #3 — reserved renderer constants never live inside a palette.
// -----------------------------------------------------------------------------

describe('LINE_REGISTRY · reserved-index safety (invariant #3)', () => {
  it.each(LINES)('%s palette contains neither white #ffffff nor black #0a0a0a', (line) => {
    for (const [i, c] of LINE_REGISTRY[line].palette.entries()) {
      expect(
        RESERVED_RENDERER_HEX.has(c.toLowerCase()),
        `${line}.palette[${i}] = ${c} — this color is a renderer constant (slot 7/8), not a palette slot`,
      ).toBe(false);
    }
  });
});

// -----------------------------------------------------------------------------
// Invariant #4 — eggFleck.char validity (per EggSprite.tsx contract).
// -----------------------------------------------------------------------------

describe('LINE_REGISTRY · eggFleck char contract (invariant #4)', () => {
  it.each(LINES)('%s eggFleck.char is exactly one character', (line) => {
    expect(LINE_REGISTRY[line].eggFleck.char.length).toBe(1);
  });

  it.each(LINES)('%s eggFleck.char is NOT a palette index or renderer char', (line) => {
    // EggSprite's grid uses single letters (O, B, G, L, N, U, A, Y) — palette
    // chars '1'..'6', empty '.', and renderer whites '7'/'8' would collide
    // with the renderer alphabet and break the egg legend lookup.
    const ch = LINE_REGISTRY[line].eggFleck.char;
    expect(
      ALLOWED_GRID_CHARS.has(ch),
      `${line} eggFleck.char '${ch}' overlaps the sprite-grid alphabet`,
    ).toBe(false);
  });

  it.each(LINES)('%s eggFleck.color is a well-formed #rrggbb hex', (line) => {
    expect(LINE_REGISTRY[line].eggFleck.color).toMatch(HEX_RGB);
  });

  it('all eggFleck.char values are pairwise unique', () => {
    const chars = LINES.map((l) => LINE_REGISTRY[l].eggFleck.char);
    expect(new Set(chars).size, `duplicate fleck chars: ${chars.join(',')}`).toBe(chars.length);
  });

  it('every eggFleck.char actually appears in the shared EGG_GRID', () => {
    // Catches the drift bug: line defines a fleck char that has no cell on
    // the egg sprite, so the player never sees the line indicator.
    for (const line of LINES) {
      const ch = LINE_REGISTRY[line].eggFleck.char;
      expect(
        EGG_GRID_CHARS_PRESENT.has(ch),
        `${line} eggFleck.char '${ch}' is not placed in EGG_GRID (src/components/EggSprite.tsx)`,
      ).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------------
// Invariant #5 — lineageNamespace uniqueness.
// -----------------------------------------------------------------------------

describe('LINE_REGISTRY · lineageNamespace uniqueness (invariant #5)', () => {
  it('no two lines share a lineageNamespace', () => {
    const namespaces = LINES.map((l) => LINE_REGISTRY[l].lineageNamespace);
    const dupes = namespaces.filter((n, i) => namespaces.indexOf(n) !== i);
    expect(dupes, `duplicate lineageNamespaces: ${dupes.join(',')}`).toEqual([]);
  });

  it.each(LINES)('%s lineageNamespace is a non-empty string', (line) => {
    const ns = LINE_REGISTRY[line].lineageNamespace;
    expect(typeof ns).toBe('string');
    expect(ns.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// Invariant #6 — transform-output palette-collision check.
// -----------------------------------------------------------------------------

/**
 * For a given line + transform, walk the rendered rects and look for two
 * cells whose source chars differ (i.e. distinct semantic regions — body vs.
 * flourish, fleck vs. spike) but whose final fill is visually
 * indistinguishable (RGB distance below threshold). Returns the offending
 * pair, or null when the rendering is unambiguous.
 */
function findVisualCollision(
  line: Line,
  transform: GridTransform,
): { aChar: string; bChar: string; aFill: string; bFill: string } | null {
  const palette: Palette = LINE_REGISTRY[line].palette;
  const baseline = LINE_REGISTRY[line].baselineGrid;
  const transformed = transform(baseline);

  // Build (char → fill) for every cell that ends up rendered. Compare each
  // pair of distinct chars at the visual-distance threshold.
  const charFills = new Map<string, string>();
  for (let y = 0; y < 16; y++) {
    const baseRow = baseline[y];
    const newRow = transformed[y];
    for (let x = 0; x < 16; x++) {
      const beforeCh = baseRow[x];
      const afterCh = newRow[x];
      // Only audit cells the transform actually changed — those are the
      // "newly-introduced" fills that risk reading as part of the body.
      if (beforeCh === afterCh) continue;
      const fill = charToFillExposed(afterCh, palette);
      if (fill !== null) charFills.set(afterCh, fill);
    }
  }

  // Compare every transform-introduced fill against every body fill in the
  // baseline (the cells the transform did NOT touch).
  const bodyChars = new Set<string>();
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = baseline[y][x];
      if (ch !== '.' && ch !== transformed[y][x]) continue; // overwritten cell
      if (ch === '.') continue;
      bodyChars.add(ch);
    }
  }

  for (const [newCh, newFill] of charFills) {
    for (const bodyCh of bodyChars) {
      if (bodyCh === newCh) continue;
      const bodyFill = charToFillExposed(bodyCh, palette);
      if (bodyFill === null) continue;
      if (rgbDistanceSq(newFill, bodyFill) <= VISUAL_COLLISION_THRESHOLD_SQ) {
        return { aChar: newCh, bChar: bodyCh, aFill: newFill, bFill: bodyFill };
      }
    }
  }
  return null;
}

/** Mirror of spriteRenderer.charToFill, intentionally inlined so the test
 *  is independent of the renderer's options/fallback behavior. */
function charToFillExposed(ch: string, palette: Palette): string | null {
  if (ch === '.') return null;
  if (ch === '7') return PALETTE_WHITE;
  if (ch === '8') return PALETTE_BLACK;
  const idx = ch.charCodeAt(0) - '1'.charCodeAt(0);
  if (idx < 0 || idx > 5) return null;
  return palette[idx];
}

describe('LINE_REGISTRY · transform palette-collision check (invariant #6)', () => {
  // Iterate every (line × transform) pair. The transform is constructed with
  // the owning line's palette so the renderer's palette-aware
  // collision-avoidance (slot-4↔slot-2 fallback in `pickCrownChar`) is
  // exercised the same way it runs in production. ADR-0005 follow-up #7
  // (static cream-on-cream) and the cycle-3 escalation on gale are resolved
  // through that same fallback path — no line should be excluded.
  for (const { name, build } of TRANSFORM_FACTORIES) {
    for (const line of LINES) {
      it(`${line} + ${name}: no transform↔body fill collision`, () => {
        const transform = build(LINE_REGISTRY[line].palette);
        const collision = findVisualCollision(line, transform);
        expect(
          collision,
          collision
            ? `${line} ${name}: char '${collision.aChar}' (${collision.aFill}) collides with body char '${collision.bChar}' (${collision.bFill})`
            : '',
        ).toBeNull();
      });
    }
  }
});

// -----------------------------------------------------------------------------
// Invariant #7 — derived exports stay in sync with LINE_REGISTRY.
// -----------------------------------------------------------------------------

describe('LINE_REGISTRY · derived-export parity (invariant #7)', () => {
  it('PALETTES is deep-equal to a fresh derivation from LINE_REGISTRY', () => {
    const rederived = Object.fromEntries(
      LINES.map((l) => [l, LINE_REGISTRY[l].palette]),
    ) as unknown as Record<Line, readonly string[]>;
    expect(PALETTES).toEqual(rederived);
  });

  it('LINE_INFO is deep-equal to a fresh derivation from LINE_REGISTRY', () => {
    const rederived = Object.fromEntries(
      LINES.map((l) => {
        const d = LINE_REGISTRY[l];
        return [l, { label: d.label, tagline: d.tagline, color: d.swatch }];
      }),
    ) as Record<Line, { label: string; tagline: string; color: string }>;
    expect(LINE_INFO).toEqual(rederived);
  });

  it('HATCHABLE_BASELINES is deep-equal to a fresh derivation from LINE_REGISTRY', () => {
    const rederived = LINES.filter((l) => LINE_REGISTRY[l].hatchable ?? true);
    expect([...HATCHABLE_BASELINES]).toEqual(rederived);
  });

  it('ALL_LINES enumerates every key in LINE_REGISTRY exactly once', () => {
    expect([...ALL_LINES].sort()).toEqual([...LINES].sort());
    expect(ALL_LINES.length).toBe(new Set(ALL_LINES).size);
  });
});
