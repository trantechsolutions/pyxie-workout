// ADR-0005: Single typed contract for sprite authoring.
//
// LINE_REGISTRY is the canonical source-of-truth for everything that is
// per-line: palette, baseline grid, display metadata, egg-fleck char/color,
// lineage namespace, and hatch eligibility. All other per-line maps
// (PALETTES, LINE_INFO, HATCHABLE_BASELINES, EGG_GRID's fleck legend) are
// derived from this object, not parallel hand-maintained tables.

import type { Line } from '../store/types';

// -----------------------------------------------------------------------------
// Grid + palette types.
// -----------------------------------------------------------------------------

/**
 * A validated 16×16 sprite grid. Brand prevents passing raw `string[]` arrays
 * into the renderer — every grid must pass through `parseGrid`.
 */
export type Grid = readonly string[] & { readonly __brand: 'Grid' };

/**
 * Length-6 palette tuple. Slots 1–6 in grid chars map to indices 0–5.
 * White (`'7'`) and black (`'8'`) are renderer constants and intentionally
 * not part of the palette array — see ADR-0005.
 */
export type Palette = readonly [string, string, string, string, string, string];

export const PALETTE_WHITE = '#ffffff';
export const PALETTE_BLACK = '#0a0a0a';

const ALLOWED_GRID_CHARS = new Set(['.', '1', '2', '3', '4', '5', '6', '7', '8']);
const GRID_ROWS = 16;
const GRID_COLS = 16;

/**
 * Validate and brand a raw 16×16 grid. Throws on shape or character violations
 * so authoring mistakes fail at module load rather than render as blanks in prod.
 */
export function parseGrid(raw: readonly string[], id?: string): Grid {
  const label = id ? `grid '${id}'` : 'grid';
  if (raw.length !== GRID_ROWS) {
    throw new Error(`${label}: expected ${GRID_ROWS} rows, got ${raw.length}`);
  }
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = raw[y];
    if (typeof row !== 'string' || row.length !== GRID_COLS) {
      throw new Error(`${label}: row ${y} must be a ${GRID_COLS}-char string, got ${typeof row === 'string' ? `length=${row.length}` : typeof row}`);
    }
    for (let x = 0; x < GRID_COLS; x++) {
      const ch = row[x];
      if (!ALLOWED_GRID_CHARS.has(ch)) {
        throw new Error(`${label}: invalid char '${ch}' at (col=${x}, row=${y})`);
      }
    }
  }
  return raw as Grid;
}

// -----------------------------------------------------------------------------
// Line definition shape.
// -----------------------------------------------------------------------------

export interface EggFleck {
  /** Single char used inside the shared egg grid to mark this line's fleck cell. */
  char: string;
  /** Hex color used for this line's fleck on the egg sprite. */
  color: string;
}

export interface LineDefinition {
  label: string;
  tagline: string;
  /** UI swatch color used in label chips / line pickers. Independent of `palette`. */
  swatch: string;
  /** Length-6 palette. Slot 0 = primary, 1 = bright, 2 = light, 3 = dark, 4 = highlight, 5 = deep shadow. */
  palette: Palette;
  /** Stage-0 baseline grid for this line (the egg-hatch creature). */
  baselineGrid: Grid;
  eggFleck: EggFleck;
  /** Tree id prefix this line occupies. Currently always equal to the Line key. */
  lineageNamespace: string;
  /** Whether this line can be rolled when an egg hatches. */
  hatchable: boolean;
}

// -----------------------------------------------------------------------------
// Baseline grids. These are the stage-0 (Pebbling, Emberling, ...) sprites
// that show up immediately after hatch. Copied verbatim from the legacy
// CREATURES catalog so the refactor is byte-for-byte non-visual.
// -----------------------------------------------------------------------------

const EMBERLING = parseGrid([
  '................',
  '................',
  '................',
  '.......32.......',
  '......3221......',
  '.....322321.....',
  '....32263321....',
  '....32263321....',
  '....32213321....',
  '....37822321....',
  '....32183321....',
  '....32213321....',
  '.....322321.....',
  '......32221.....',
  '................',
  '................',
], 'ember-baseline');

const DROPET = parseGrid([
  '................',
  '.......11.......',
  '......1221......',
  '.....112221.....',
  '....11222231....',
  '....12222231....',
  '...122553224....',
  '...122553224....',
  '...127884224....',
  '...127884224....',
  '....12222234....',
  '....12222234....',
  '.....122234.....',
  '......1234......',
  '................',
  '................',
], 'tide-baseline');

const SPROUT = parseGrid([
  '................',
  '......2.........',
  '.....221........',
  '.....21.........',
  '....22.221......',
  '.....2.22.......',
  '.....3.22.......',
  '....3322322.....',
  '...332222232....',
  '...322782322....',
  '...322782322....',
  '...322222322....',
  '...332222232....',
  '....3322233.....',
  '.....44444......',
  '................',
], 'verdant-baseline');

const WISPLET = parseGrid([
  '................',
  '................',
  '................',
  '.......22.......',
  '......2332......',
  '.....233332.....',
  '....23333332....',
  '...2333787332...',
  '...2333878332...',
  '....23333332....',
  '.....233332.....',
  '......2332......',
  '.......22.......',
  '................',
  '................',
  '................',
], 'gale-baseline');

const PEBBLING = parseGrid([
  '................',
  '................',
  '................',
  '......333.......',
  '.....32223......',
  '....3221223.....',
  '....3217823.....',
  '....3218723.....',
  '....3211123.....',
  '....3225523.....',
  '....3225523.....',
  '.....322223.....',
  '......333.......',
  '................',
  '................',
  '................',
], 'stone-baseline');

const SHADEWISP = parseGrid([
  '................',
  '................',
  '................',
  '.....666666.....',
  '....66333366....',
  '...6633333366...',
  '..663338338366..',
  '..663338338366..',
  '..663333333366..',
  '..663333333366..',
  '...6633333366...',
  '....66333366....',
  '.....666666.....',
  '................',
  '................',
  '................',
], 'umbra-baseline');

const GLIMMIE = parseGrid([
  '................',
  '................',
  '......555.......',
  '.....55555......',
  '.....57775......',
  '....5577755.....',
  '....5587755.....',
  '...555555555....',
  '...533333335....',
  '....3322233.....',
  '....3222223.....',
  '....3222223.....',
  '.....33333......',
  '......333.......',
  '................',
  '................',
], 'aurora-baseline');

const SPARKLER = parseGrid([
  '................',
  '.....1...1......',
  '......1.1.......',
  '.......1........',
  '......11111.....',
  '.....2333321....',
  '....233333321...',
  '...23377333321..',
  '...23388333321..',
  '....233333321...',
  '.....2333321....',
  '......1111......',
  '.......11.......',
  '.......1........',
  '................',
  '................',
], 'static-baseline');

// -----------------------------------------------------------------------------
// The registry itself.
// -----------------------------------------------------------------------------

export const LINE_REGISTRY: Record<Line, LineDefinition> = {
  ember: {
    label: 'Ember',
    tagline: 'Forged in fire',
    swatch: '#ff7f50',
    palette: ['#ff4422', '#ff8844', '#ffcc66', '#aa1100', '#ffee99', '#5a0d00'],
    baselineGrid: EMBERLING,
    eggFleck: { char: 'O', color: '#FF6B35' },
    lineageNamespace: 'ember',
    hatchable: true,
  },
  tide: {
    label: 'Tide',
    tagline: 'Born of the deep',
    swatch: '#7df9ff',
    palette: ['#3366cc', '#5599ee', '#88ccff', '#1a3380', '#ccf2ff', '#0a1a4a'],
    baselineGrid: DROPET,
    eggFleck: { char: 'B', color: '#3DBEDC' },
    lineageNamespace: 'tide',
    hatchable: true,
  },
  verdant: {
    label: 'Verdant',
    tagline: 'Rooted in earth',
    swatch: '#7fff7f',
    palette: ['#3aaa45', '#66dd55', '#bbee88', '#1a6622', '#e8ffcc', '#4a3320'],
    baselineGrid: SPROUT,
    eggFleck: { char: 'G', color: '#8AC34A' },
    lineageNamespace: 'verdant',
    hatchable: true,
  },
  gale: {
    label: 'Gale',
    tagline: 'Carried on the wind',
    swatch: '#c8d2e0',
    palette: ['#a0a8b8', '#c8d2e0', '#e8eef5', '#4a5566', '#fbfcfd', '#1a2030'],
    baselineGrid: WISPLET,
    eggFleck: { char: 'L', color: '#B8C5D6' },
    lineageNamespace: 'gale',
    hatchable: true,
  },
  stone: {
    label: 'Stone',
    tagline: 'Patient and unbroken',
    swatch: '#b8a890',
    palette: ['#8a7866', '#b8a890', '#d8c9b0', '#3a2e22', '#ede5d0', '#1a1410'],
    baselineGrid: PEBBLING,
    eggFleck: { char: 'N', color: '#C9A47C' },
    lineageNamespace: 'stone',
    hatchable: true,
  },
  umbra: {
    label: 'Umbra',
    tagline: 'Shaped in shadow',
    swatch: '#a89bc4',
    palette: ['#7c6d8f', '#a89bc4', '#d8c8ec', '#221830', '#f0e6ff', '#0c0716'],
    baselineGrid: SHADEWISP,
    eggFleck: { char: 'U', color: '#A89BC4' },
    lineageNamespace: 'umbra',
    hatchable: true,
  },
  aurora: {
    label: 'Aurora',
    tagline: 'Lit from within',
    swatch: '#ffb4d8',
    palette: ['#ffb4d8', '#b8d8ff', '#ffe4b4', '#9070b4', '#fff8dc', '#3a2a5a'],
    baselineGrid: GLIMMIE,
    eggFleck: { char: 'A', color: '#FFB4D8' },
    lineageNamespace: 'aurora',
    hatchable: true,
  },
  static: {
    label: 'Static',
    tagline: 'Charged and restless',
    swatch: '#ffea66',
    palette: ['#ffd633', '#ffea66', '#fff5b3', '#664400', '#ffffe6', '#1a1500'],
    baselineGrid: SPARKLER,
    eggFleck: { char: 'Y', color: '#FFEA66' },
    lineageNamespace: 'static',
    hatchable: true,
  },
};

// -----------------------------------------------------------------------------
// Derived exports. Anything that was previously hand-maintained as a parallel
// Record<Line, …> map now derives from LINE_REGISTRY here so adding a new line
// is genuinely a one-file change.
// -----------------------------------------------------------------------------

export const ALL_LINES: readonly Line[] = Object.keys(LINE_REGISTRY) as Line[];

export const HATCHABLE_BASELINES: readonly Line[] = ALL_LINES.filter(
  (l) => LINE_REGISTRY[l].hatchable,
);
