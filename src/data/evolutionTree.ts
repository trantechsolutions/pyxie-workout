import type { Line } from '../store/types';
import { CREATURES } from './creatures';
import altGridsJson from './altGrids.json';

// Branching evolution tree (ADR-0003).
//
// Topology — 248 nodes across 8 baseline lines (31 per line):
//   Stage 0: 8 baselines  (hatch root)
//   Stage 1: 16  (each baseline branches on `intensity`)
//   Stage 2: 32  (each branches on `complexity`)
//   Stage 3: 64  (branches on `intensity`)
//   Stage 4: 128 (terminal final forms)
//
// Node IDs follow the pattern `<line>` (baseline) or `<line>-<path>` where
// `path` is a sequence of `p` (primary) and `a` (alt) chars, one per evolution
// taken since the baseline. e.g. `ember-pap` = ember → primary → alt → primary.
//
// `branchAxis` controls which workoutCount dimension steers the next evolution:
//   - 'intensity'  : easy/medium → primary; hard → alt.
//   - 'complexity' : beginner → primary; intermediate/advanced → alt.
// See `chooseBranch()` in src/lib/progression.ts.

export type BranchAxis = 'intensity' | 'complexity';

export interface EvolutionNode {
  id: string;
  name: string;
  line: Line;
  stage: number;
  branchAxis: BranchAxis | null;
  children: { primary: string; alt: string } | null;
  // 16x16 sprite grid (same convention as `CREATURES` in creatures.ts).
  // `null` means art is pending — Sprite falls back to a procedural placeholder.
  grid: string[] | null;
}

// Final-stage index. Stages run 0..MAX_STAGE; nodes at MAX_STAGE are terminal.
const MAX_STAGE = 4;

// Per-stage branch axis. Index = stage of the PARENT node (0..MAX_STAGE-1).
// Stage 0 parent → stage 1 child: branches on intensity, etc.
const BRANCH_AXIS_BY_STAGE = ['intensity', 'complexity', 'intensity', 'complexity'] as const satisfies readonly BranchAxis[];

// =============================================================================
// Display-name fragments. Authored names are pulled here; everything else falls
// back to a deterministic `<Baseline> <Path>` template. Names lean on
// Pokemon/Digimon flavor — short, evocative, two syllables where possible.
// =============================================================================

const AUTHORED_NAMES: Record<string, string> = {
  // Ember line --------------------------------------------------------------
  'ember':       'Emberling',
  'ember-p':     'Cinderpup',
  'ember-pp':    'Pyrokit',
  'ember-ppp':   'Infernox',
  'ember-pppp':  'Drakorath',
  'ember-pppa':  'Drakoreth',
  'ember-a':     'Sparkit',
  'ember-pa':    'Blazewig',
  'ember-ap':    'Volcanid',
  'ember-aa':    'Smolderling',
  'ember-ppa':   'Vulkaron',
  'ember-ppap':  'Caldermane',
  'ember-ppaa':  'Magvolg',
  'ember-pap':   'Cindarro',
  'ember-papp':  'Cindreon',
  'ember-papa':  'Cindrazor',
  'ember-paa':   'Soothspark',
  'ember-paap':  'Hearthwarden',
  'ember-paaa':  'Spitehearth',
  'ember-app':   'Magmir',
  'ember-appp':  'Lavanos',
  'ember-appa':  'Volkrend',
  'ember-apa':   'Pyrebrand',
  'ember-apap':  'Pyresanct',
  'ember-apaa':  'Pyrerend',
  'ember-aap':   'Coalfin',
  'ember-aapp':  'Coalcrown',
  'ember-aapa':  'Coalflense',
  'ember-aaa':   'Charwyrm',
  'ember-aaap':  'Charserath',
  'ember-aaaa':  'Pyrorax',

  // Tide line ---------------------------------------------------------------
  'tide':        'Dropet',
  'tide-p':      'Bubblin',
  'tide-pp':     'Tidalkin',
  'tide-ppp':    'Mareclaw',
  'tide-pppp':   'Leviathos',
  'tide-pppa':   'Leviabyss',
  'tide-a':      'Coralune',
  'tide-pa':     'Brinewhip',
  'tide-ap':     'Reefling',
  'tide-aa':     'Saltspire',
  'tide-ppa':    'Abyssal',
  'tide-ppap':   'Abysseign',
  'tide-ppaa':   'Trenchmaw',
  'tide-pap':    'Streamblade',
  'tide-papp':   'Streamhalo',
  'tide-papa':   'Riveterr',
  'tide-paa':    'Mistral',
  'tide-paap':   'Mistrelle',
  'tide-paaa':   'Typhrall',
  'tide-app':    'Currentide',
  'tide-appp':   'Currelune',
  'tide-appa':   'Riptarch',
  'tide-apa':    'Pelagith',
  'tide-apap':   'Pelagrand',
  'tide-apaa':   'Pelagore',
  'tide-aap':    'Surfsong',
  'tide-aapp':   'Surfaria',
  'tide-aapa':   'Surfreck',
  'tide-aaa':    'Maelstrix',
  'tide-aaap':   'Maelnaut',
  'tide-aaaa':   'Maelrax',

  // Verdant line ------------------------------------------------------------
  'verdant':       'Sprout',
  'verdant-p':     'Mosswick',
  'verdant-pp':    'Vinepaw',
  'verdant-ppp':   'Thornroot',
  'verdant-pppp':  'Sylvadrake',
  'verdant-pppa':  'Sylvabane',
  'verdant-a':     'Mycel',
  'verdant-pa':    'Briarcub',
  'verdant-ap':    'Spireleaf',
  'verdant-aa':    'Sporebound',
  'verdant-ppa':   'Bramblefen',
  'verdant-ppap':  'Bramblord',
  'verdant-ppaa':  'Brambrand',
  'verdant-pap':   'Petalblade',
  'verdant-papp':  'Petalune',
  'verdant-papa':  'Petalreave',
  'verdant-paa':   'Bloomhart',
  'verdant-paap':  'Bloomarch',
  'verdant-paaa':  'Vexbloom',
  'verdant-app':   'Loamspike',
  'verdant-appp':  'Loamfather',
  'verdant-appa':  'Loamrend',
  'verdant-apa':   'Sapwing',
  'verdant-apap':  'Sapseraph',
  'verdant-apaa':  'Sapwraith',
  'verdant-aap':   'Mossfang',
  'verdant-aapp':  'Mossward',
  'verdant-aapa':  'Mossfray',
  'verdant-aaa':   'Cordycept',
  'verdant-aaap':  'Cordycrown',
  'verdant-aaaa':  'Cordyrax',

  // Gale line --------------------------------------------------------------
  'gale':        'Wisplet',
  'gale-p':      'Zephyrling',
  'gale-pp':     'Galekit',
  'gale-ppp':    'Cyclonix',
  'gale-pppp':   'Tempestar',
  'gale-pppa':   'Tempestral',
  'gale-a':      'Gustcub',
  'gale-pa':     'Skydancer',
  'gale-ap':     'Squallhound',
  'gale-aa':     'Boltwing',
  'gale-ppa':    'Stormvane',
  'gale-ppap':   'Stormcrown',
  'gale-ppaa':   'Stormrend',
  'gale-pap':    'Driftspire',
  'gale-papp':   'Driftborn',
  'gale-papa':   'Driftrazor',
  'gale-paa':    'Lullaby',
  'gale-paap':   'Lullward',
  'gale-paaa':   'Lullbane',
  'gale-app':    'Tornadom',
  'gale-appp':   'Tornareign',
  'gale-appa':   'Tornarend',
  'gale-apa':    'Galewind',
  'gale-apap':   'Galehalo',
  'gale-apaa':   'Galereave',
  'gale-aap':    'Boltrend',
  'gale-aapp':   'Boltcrown',
  'gale-aapa':   'Boltflense',
  'gale-aaa':    'Stormwyrm',
  'gale-aaap':   'Stormserath',
  'gale-aaaa':   'Skyrax',

  // Stone line -------------------------------------------------------------
  'stone':       'Pebbling',
  'stone-p':     'Cobbleton',
  'stone-pp':    'Granicub',
  'stone-ppp':   'Boulderth',
  'stone-pppp':  'Megalith',
  'stone-pppa':  'Megabane',
  'stone-a':     'Shaleling',
  'stone-pa':    'Cobblerend',
  'stone-ap':    'Granibrand',
  'stone-aa':    'Shaledrake',
  'stone-ppa':   'Bouldervane',
  'stone-ppap':  'Bouldercrown',
  'stone-ppaa':  'Boulderrend',
  'stone-pap':   'Cragspike',
  'stone-papp':  'Cragknight',
  'stone-papa':  'Cragblade',
  'stone-paa':   'Quartzhart',
  'stone-paap':  'Quartzward',
  'stone-paaa':  'Quartzbane',
  'stone-app':   'Marblok',
  'stone-appp':  'Marbleon',
  'stone-appa':  'Marblerend',
  'stone-apa':   'Shaleblade',
  'stone-apap':  'Shaledawn',
  'stone-apaa':  'Shalerend',
  'stone-aap':   'Geodefang',
  'stone-aapp':  'Geodecrown',
  'stone-aapa':  'Geodeflense',
  'stone-aaa':   'Obsiwyrm',
  'stone-aaap':  'Obsiserath',
  'stone-aaaa':  'Stonerax',

  // Umbra line ------------------------------------------------------------
  'umbra':         'Shadewisp',
  'umbra-p':       'Nocturn',
  'umbra-pp':      'Veilkit',
  'umbra-ppp':     'Duskaron',
  'umbra-pppp':    'Nyxalon',
  'umbra-pppa':    'Nyxbane',
  'umbra-a':       'Glooming',
  'umbra-pa':      'Veilwhip',
  'umbra-ap':      'Pallid',
  'umbra-aa':      'Shrouded',
  'umbra-ppa':     'Eveborn',
  'umbra-ppap':    'Evecrown',
  'umbra-ppaa':    'Everend',
  'umbra-pap':     'Shadblade',
  'umbra-papp':    'Shadborne',
  'umbra-papa':    'Shadrazor',
  'umbra-paa':     'Hushwing',
  'umbra-paap':    'Hushward',
  'umbra-paaa':    'Hushbane',
  'umbra-app':     'Mireling',
  'umbra-appp':    'Mirethrone',
  'umbra-appa':    'Mirerend',
  'umbra-apa':     'Veilbrand',
  'umbra-apap':    'Veilsanct',
  'umbra-apaa':    'Veilreave',
  'umbra-aap':     'Gloamfang',
  'umbra-aapp':    'Gloamcrown',
  'umbra-aapa':    'Gloamflense',
  'umbra-aaa':     'Pallwyrm',
  'umbra-aaap':    'Palserath',
  'umbra-aaaa':    'Voidrax',

  // Aurora line -----------------------------------------------------------
  'aurora':        'Glimmie',
  'aurora-p':      'Lumenpup',
  'aurora-pp':     'Lumikit',
  'aurora-ppp':    'Iridine',
  'aurora-pppp':   'Solarion',
  'aurora-pppa':   'Solaribane',
  'aurora-a':      'Petal',
  'aurora-pa':     'Hueflit',
  'aurora-ap':     'Bloomray',
  'aurora-aa':     'Halokit',
  'aurora-ppa':    'Iridorn',
  'aurora-ppap':   'Iridorncrown',
  'aurora-ppaa':   'Iridornrend',
  'aurora-pap':    'Luxblade',
  'aurora-papp':   'Luxborne',
  'aurora-papa':   'Luxreave',
  'aurora-paa':    'Calmlight',
  'aurora-paap':   'Calmward',
  'aurora-paaa':   'Calmbane',
  'aurora-app':    'Sparkmir',
  'aurora-appp':   'Sparkthrone',
  'aurora-appa':   'Sparkrend',
  'aurora-apa':    'Daydusk',
  'aurora-apap':   'Daysanct',
  'aurora-apaa':   'Dayrend',
  'aurora-aap':    'Pastelfin',
  'aurora-aapp':   'Pastelcrown',
  'aurora-aapa':   'Pastelflense',
  'aurora-aaa':    'Pastelwyrm',
  'aurora-aaap':   'Pastelserath',
  'aurora-aaaa':   'Aurorax',

  // Static line -----------------------------------------------------------
  'static':        'Sparkler',
  'static-p':      'Joltpup',
  'static-pp':     'Voltkit',
  'static-ppp':    'Voltarox',
  'static-pppp':   'Thundorath',
  'static-pppa':   'Thundoreth',
  'static-a':      'Buzzlet',
  'static-pa':     'Crackwhip',
  'static-ap':     'Zaprid',
  'static-aa':     'Cracklin',
  'static-ppa':    'Voltarcis',
  'static-ppap':   'Voltarcrown',
  'static-ppaa':   'Voltarend',
  'static-pap':    'Boltgale',
  'static-papp':   'Boltherald',
  'static-papa':   'Boltrazor',
  'static-paa':    'Hummark',
  'static-paap':   'Hummward',
  'static-paaa':   'Hummbane',
  'static-app':    'Plasmir',
  'static-appp':   'Plasmaron',
  'static-appa':   'Plasmerend',
  'static-apa':    'Zapbrand',
  'static-apap':   'Zapsanct',
  'static-apaa':   'Zaprend',
  'static-aap':    'Crackfin',
  'static-aapp':   'Crackcrown',
  'static-aapa':   'Crackflense',
  'static-aaa':    'Buzzwyrm',
  'static-aaap':   'Buzzserath',
  'static-aaaa':   'Staticrax',
};

// =============================================================================
// Sprite grids. Existing creatures keep their original art via creatures.ts;
// stage-1 alts (`*-a`) get net-new authored grids here. Everything else is
// `null` and resolves to a procedural placeholder in Sprite.tsx.
// =============================================================================

// ember-a — "Sparkit": a small bipedal fox-cub with electric tufts (Pikachu × Coronamon).
const SPARKIT: string[] = [
  '................',
  '...3.......3....',
  '...33.....33....',
  '....3.....3.....',
  '....3221222.....',
  '...322212223....',
  '..3221717123....',
  '..3221818123....',
  '..3221212123....',
  '..3221555123....',
  '...3225552233...',
  '....322522.33...',
  '....322222..3...',
  '....3.4.4.......',
  '.....4...4......',
  '................',
];

// tide-a — "Coralune": seahorse-ish with a coiled tail and coral crest (Horsea × Otamamon).
const CORALUNE: string[] = [
  '................',
  '......555.......',
  '.....55555......',
  '....5532255.....',
  '....553225......',
  '....5322232.....',
  '....5322232.....',
  '....5371832.....',
  '....5378132.....',
  '....5322232.....',
  '....5322232.....',
  '....53222322....',
  '.....3222223....',
  '......32223.....',
  '.......3232.....',
  '........44......',
];

// verdant-a — "Mycel": tiny mushroom-creature, polka-dot cap (Foongus × Mushroomon).
const MYCEL: string[] = [
  '................',
  '................',
  '.....55555......',
  '....5717155.....',
  '...557171755....',
  '..55517171555...',
  '..555555555.....',
  '...3322233......',
  '...3222223......',
  '...3271723......',
  '...3271723......',
  '...3222223......',
  '....32223.......',
  '....3...3.......',
  '....4...4.......',
  '................',
];

// gale-a — "Gustcub": small wind-cub with cloud-tufts, alt branch from Wisplet.
const GUSTCUB: string[] = [
  '................',
  '....2.......2...',
  '...232.....232..',
  '..23332...23332.',
  '...3322232233...',
  '..3322212223....',
  '..3221717123....',
  '..3221818123....',
  '..3221212123....',
  '..3221555123....',
  '...3225552233...',
  '....322522.33...',
  '....322222..3...',
  '....3.4.4.......',
  '.....4...4......',
  '................',
];

// stone-a — "Shaleling": flat slate-shard creature, alt branch from Pebbling.
const SHALELING: string[] = [
  '................',
  '................',
  '......333.......',
  '.....32223......',
  '....3221223.....',
  '....3217823.....',
  '....3218723.....',
  '....3211123.....',
  '...32222223.....',
  '...32555523.....',
  '..3225555223....',
  '.32255555223....',
  '.32222223.......',
  '..3333..........',
  '..4.4...........',
  '................',
];

// -----------------------------------------------------------------------------
// Alt-branch grids. Same 16×16 char convention; palette indices 1-6 map into the
// owning line's PALETTES entry, so identical structure across lines renders as
// a different creature thanks to the palette swap. Where a line needs a
// distinct silhouette (e.g., gale's airier limbs, stone's chunkier bulk), the
// grid is authored fresh; otherwise the shared archetype is reused.
// -----------------------------------------------------------------------------

// Alt-branch grids — extracted to JSON (single source-of-truth shared with
// scripts/generate-tree-sprites.cjs). Same 16×16 char convention; palette
// indices 1-6 map into the owning line's PALETTES entry.
const ALT_GRIDS: Record<string, string[]> = altGridsJson as Record<string, string[]>;

// umbra-a — "Glooming": small floating shadow-blob with two eyes.
const GLOOMING: string[] = [
  '................','................','................','......333.......',
  '.....33333......','....3322233.....','....3217823.....','....3218723.....',
  '....3221123.....','....3222223.....','...33222233.....','..6.32223.6.....',
  '...6444.6.......','................','................','................',
];

// aurora-a — "Petal": a four-petal flower with a soft center.
const PETAL: string[] = [
  '................','................','......3..3......','.....535.535....',
  '....55353535....','....55555555....','....55571555....','....55785555....',
  '....55555555....','....55353535....','.....535.535....','......3..3......',
  '.......33.......','........4.......','................','................',
];

// static-a — "Buzzlet": small bug with twin antennae and zigzag tail.
const BUZZLET: string[] = [
  '................','...1........1...','....1......1....','.....1....1.....',
  '......1..1......','.......11.......','......22222.....','.....2222222....',
  '....22277822....','....22288722....','....22222222....','....25155152....',
  '.....22222......','.......11.......','....1......1....','...1........1...',
];

const NEW_GRIDS: Record<string, string[]> = {
  'ember-a':   SPARKIT,
  'tide-a':    CORALUNE,
  'verdant-a': MYCEL,
  'gale-a':    GUSTCUB,
  'stone-a':   SHALELING,
  'umbra-a':   GLOOMING,
  'aurora-a':  PETAL,
  'static-a':  BUZZLET,
  ...ALT_GRIDS,
};

// -----------------------------------------------------------------------------
// Stage-4 leaf synthesis. Each non-spine leaf inherits its stage-3 parent's
// silhouette and overlays a small "ascension" flourish so it reads as a final
// form rather than an identical reskin. The flourish is determined by the
// leaf's last path character:
//   `+p` (primary, beginner-leaning elder)  → cream crown across row 0
//   `+a` (alt, int/adv-leaning weaponized) → angular spikes at row 15 corners
// The spine final (`*-pppp`) is skipped — those keep their authored CREATURES
// grid (Drakorath, Leviathos, etc.).
// -----------------------------------------------------------------------------

function overlayCell(rows: string[][], y: number, x: number, ch: string): void {
  if (y < 0 || y > 15 || x < 0 || x > 15) return;
  if (rows[y][x] === '.') rows[y][x] = ch;
}

function withLeafFlourish(parent: string[], suffix: 'p' | 'a'): string[] {
  const rows = parent.map((r) => r.split(''));
  if (suffix === 'p') {
    // Soft cream crown across the head row — index 5 (highlight) every other column.
    for (const x of [5, 7, 9, 10]) overlayCell(rows, 0, x, '5');
    // Mirror dot at corners of row 1 for a halo bracket.
    overlayCell(rows, 1, 4, '5');
    overlayCell(rows, 1, 11, '5');
  } else {
    // Angular shadow spikes at the bottom — index 4 (shadow) framing the feet.
    for (const x of [2, 3, 12, 13]) overlayCell(rows, 15, x, '4');
    overlayCell(rows, 14, 1, '4');
    overlayCell(rows, 14, 14, '4');
  }
  return rows.map((r) => r.join(''));
}

const STAGE3_PATHS = ['ppp', 'ppa', 'pap', 'paa', 'app', 'apa', 'aap', 'aaa'] as const;
const LEAF_LINES: readonly Line[] = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];

// Stage-3 spine parent (`*-ppp`) lives in the legacy CREATURES catalog (index 2
// = stage 3 — CREATURES is 0-indexed off stage 1). Fall back to it so the
// `*-ppp` → `*-pppa` synthesis works without duplicating Pyrokit/Tidalkin/etc.
function stage3ParentGrid(line: Line, path: string): string[] | undefined {
  const direct = NEW_GRIDS[`${line}-${path}`];
  if (direct) return direct;
  if (path === 'ppp') return CREATURES[line]?.[2]?.grid; // stage 3 = index 2
  return undefined;
}

for (const line of LEAF_LINES) {
  for (const path of STAGE3_PATHS) {
    const parent = stage3ParentGrid(line, path);
    if (!parent) continue;
    // `*-pppp` is the spine final — keeps its authored CREATURES grid.
    if (path !== 'ppp') NEW_GRIDS[`${line}-${path}p`] = withLeafFlourish(parent, 'p');
    NEW_GRIDS[`${line}-${path}a`] = withLeafFlourish(parent, 'a');
  }
}

// =============================================================================
// Tree construction.
// =============================================================================

const LINES: Line[] = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];
const PATH_CHARS: ('p' | 'a')[] = ['p', 'a'];

// Capitalize the first letter for templated names.
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function templateName(line: Line, path: string): string {
  // e.g. ember-pap → "Ember PAP" — readable placeholder until art lands.
  return `${cap(line)} ${path.toUpperCase()}`;
}

function buildNode(line: Line, path: string): EvolutionNode {
  const id = path.length === 0 ? line : `${line}-${path}`;
  const stage = path.length;
  const isFinal = stage >= MAX_STAGE;
  // `${line}-${''}p` collapses to `${line}-p`, so the stage-0 case needs no
  // special branch here.
  const childPrimary = `${line}-${path}p`;
  const childAlt     = `${line}-${path}a`;

  return {
    id,
    name: AUTHORED_NAMES[id] ?? templateName(line, path || 'BASE'),
    line,
    stage,
    branchAxis: isFinal ? null : BRANCH_AXIS_BY_STAGE[stage],
    children: isFinal ? null : { primary: childPrimary, alt: childAlt },
    grid: NEW_GRIDS[id] ?? null,
  };
}

function buildTree(): Record<string, EvolutionNode> {
  const tree: Record<string, EvolutionNode> = {};
  for (const line of LINES) {
    // Walk every binary path 0..4 chars long.
    const stack: string[] = [''];
    while (stack.length) {
      const path = stack.pop()!;
      const node = buildNode(line, path);
      tree[node.id] = node;
      if (path.length < MAX_STAGE) {
        for (const c of PATH_CHARS) stack.push(path + c);
      }
    }
  }
  return tree;
}

export const EVOLUTION_TREE: Record<string, EvolutionNode> = buildTree();

// =============================================================================
// Lookups + helpers.
// =============================================================================

export const BASELINE_LINEAGE_IDS: readonly string[] = LINES;

export function getNode(id: string): EvolutionNode | null {
  return EVOLUTION_TREE[id] ?? null;
}

/**
 * Migrate a legacy `(line, stage)` pair (pre-tree saves) to a tree lineageId.
 * Legacy pets lived on the all-primary spine, so the path is just `p` * stage.
 */
export function legacyLineageId(line: Line, stage: number): string {
  const clamped = Math.max(0, Math.min(MAX_STAGE, stage));
  if (clamped === 0) return line;
  return `${line}-${'p'.repeat(clamped)}`;
}

/**
 * Total node count exposed for sanity checks / tests.
 * Per-line: 1 + 2 + 4 + 8 + 16 = 31 over 5 stages.
 * Across 8 lines: 248. (The original ADR's "48" undercounted by collapsing
 * stage 4 — this implementation keeps full binary branching for that stage too,
 * so the tree explores every habit permutation. Art-debt scales linearly with
 * branches the user actually visits — most playthroughs only render a handful.)
 */
export const TREE_NODE_COUNT = Object.keys(EVOLUTION_TREE).length;
