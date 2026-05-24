import { describe, it, expect } from 'vitest';
import { EVOLUTION_TREE, BASELINE_LINEAGE_IDS, legacyLineageId, getNode, TREE_NODE_COUNT } from '../src/data/evolutionTree';
import { chooseBranch, nextLineageId, applyWorkoutResult } from '../src/lib/progression';
import type { WorkoutCounts, Line } from '../src/store/types';
import { makePet } from './helpers';

function emptyCounts(): WorkoutCounts {
  return {
    intensity:  { easy: 0, medium: 0, hard: 0 },
    complexity: { beginner: 0, intermediate: 0, advanced: 0 },
  };
}

describe('EVOLUTION_TREE structure', () => {
  it('contains 248 nodes (31 per line × 8 lines)', () => {
    expect(TREE_NODE_COUNT).toBe(248);
  });

  it('exposes eight baseline ids', () => {
    expect([...BASELINE_LINEAGE_IDS].sort()).toEqual(['aurora', 'ember', 'gale', 'static', 'stone', 'tide', 'umbra', 'verdant']);
  });

  it('every non-final node points to children that exist in the tree', () => {
    for (const node of Object.values(EVOLUTION_TREE)) {
      if (node.children) {
        expect(EVOLUTION_TREE[node.children.primary], `${node.id} → primary`).toBeDefined();
        expect(EVOLUTION_TREE[node.children.alt],     `${node.id} → alt`).toBeDefined();
      }
    }
  });

  it('stage-4 nodes are terminal (no children, no branchAxis)', () => {
    const stage4 = Object.values(EVOLUTION_TREE).filter((n) => n.stage === 4);
    expect(stage4).toHaveLength(128); // 16 paths × 8 lines
    for (const n of stage4) {
      expect(n.children).toBeNull();
      expect(n.branchAxis).toBeNull();
    }
  });

  it('legacy spine ids resolve correctly', () => {
    expect(legacyLineageId('ember', 0)).toBe('ember');
    expect(legacyLineageId('ember', 1)).toBe('ember-p');
    expect(legacyLineageId('tide', 4)).toBe('tide-pppp');
    expect(legacyLineageId('verdant', 2)).toBe('verdant-pp');
  });

  it('legacy spine names match the original CREATURES table', () => {
    expect(getNode('ember')?.name).toBe('Emberling');
    expect(getNode('ember-p')?.name).toBe('Cinderpup');
    expect(getNode('ember-pp')?.name).toBe('Pyrokit');
    expect(getNode('tide-pppp')?.name).toBe('Leviathos');
    expect(getNode('verdant-pppp')?.name).toBe('Sylvadrake');
  });

  it('authors net-new stage-1 alts (Sparkit/Coralune/Mycel) with grids', () => {
    expect(getNode('ember-a')?.name).toBe('Sparkit');
    expect(getNode('tide-a')?.name).toBe('Coralune');
    expect(getNode('verdant-a')?.name).toBe('Mycel');
    expect(getNode('ember-a')?.grid).not.toBeNull();
    expect(getNode('tide-a')?.grid).not.toBeNull();
    expect(getNode('verdant-a')?.grid).not.toBeNull();
  });
});

describe('chooseBranch', () => {
  it('intensity: zero counts favor primary', () => {
    expect(chooseBranch('intensity', emptyCounts())).toBe('primary');
  });

  it('intensity: hard-dominant → alt', () => {
    const c = emptyCounts();
    c.intensity.hard = 5;
    c.intensity.easy = 1;
    expect(chooseBranch('intensity', c)).toBe('alt');
  });

  it('intensity: easy+medium-dominant → primary', () => {
    const c = emptyCounts();
    c.intensity.easy = 3;
    c.intensity.medium = 2;
    c.intensity.hard = 4;
    expect(chooseBranch('intensity', c)).toBe('primary');
  });

  it('complexity: advanced+intermediate dominant → alt', () => {
    const c = emptyCounts();
    c.complexity.beginner = 1;
    c.complexity.intermediate = 1;
    c.complexity.advanced = 2;
    expect(chooseBranch('complexity', c)).toBe('alt');
  });

  it('complexity: beginner-dominant → primary', () => {
    const c = emptyCounts();
    c.complexity.beginner = 4;
    c.complexity.intermediate = 2;
    expect(chooseBranch('complexity', c)).toBe('primary');
  });
});

describe('nextLineageId traversal', () => {
  it('returns the primary child when counts favor primary', () => {
    const c = emptyCounts();
    c.intensity.easy = 3;
    expect(nextLineageId('ember', c)).toBe('ember-p');
  });

  it('returns the alt child when counts favor alt', () => {
    const c = emptyCounts();
    c.intensity.hard = 5;
    expect(nextLineageId('ember', c)).toBe('ember-a');
  });

  it('returns null at a final-stage node', () => {
    const c = emptyCounts();
    c.intensity.hard = 99;
    expect(nextLineageId('ember-pppp', c)).toBeNull();
  });

  it('returns null on unknown lineageId', () => {
    expect(nextLineageId('nonsense', emptyCounts())).toBeNull();
  });

  it('uses complexity at stage 1→2 transition', () => {
    const c = emptyCounts();
    c.complexity.advanced = 4;
    expect(nextLineageId('ember-p', c)).toBe('ember-pa');
    c.complexity.advanced = 0;
    c.complexity.beginner = 4;
    expect(nextLineageId('ember-p', c)).toBe('ember-pp');
  });
});

// =============================================================================
// Coverage additions — tree topology, name completeness, branch invariants,
// applyWorkoutResult projection, legacy migration clamping.
// =============================================================================

describe('tree topology', () => {
  it('distributes nodes 8/16/32/64/128 across stages 0-4 (8 lines)', () => {
    const byStage: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const n of Object.values(EVOLUTION_TREE)) byStage[n.stage]++;
    expect(byStage).toEqual({ 0: 8, 1: 16, 2: 32, 3: 64, 4: 128 });
  });

  it('every line owns exactly 31 nodes', () => {
    const byLine: Record<string, number> = { ember: 0, tide: 0, verdant: 0, gale: 0, stone: 0, umbra: 0, aurora: 0, static: 0 };
    for (const n of Object.values(EVOLUTION_TREE)) byLine[n.line]++;
    expect(byLine).toEqual({ ember: 31, tide: 31, verdant: 31, gale: 31, stone: 31, umbra: 31, aurora: 31, static: 31 });
  });

  it("every node's `line` field matches its id prefix", () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      expect(n.id.startsWith(n.line)).toBe(true);
    }
  });

  it("every node's `stage` equals the number of path chars after the dash", () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      const dashIdx = n.id.indexOf('-');
      const pathLen = dashIdx === -1 ? 0 : n.id.length - dashIdx - 1;
      expect(n.stage).toBe(pathLen);
    }
  });

  it('every non-final node carries a valid branchAxis', () => {
    const expected: Record<number, 'intensity' | 'complexity'> = {
      0: 'intensity',
      1: 'complexity',
      2: 'intensity',
      3: 'complexity',
    };
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.stage < 4) expect(n.branchAxis).toBe(expected[n.stage]);
    }
  });
});

describe('name coverage', () => {
  it('every node has a non-empty, trimmed name', () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      expect(n.name, `${n.id} missing name`).toBeTruthy();
      expect(n.name.trim()).toBe(n.name);
      expect(n.name.length).toBeGreaterThan(0);
    }
  });

  it('no node falls back to the templateName placeholder (e.g. "Ember PPAA")', () => {
    // templateName format is `<Capitalized line> <PATH-UPPERCASE>` — uppercase
    // alpha chars after a space. Any authored name lacks that pattern.
    const placeholderPattern = /^(Ember|Tide|Verdant) [A-Z]+$/;
    for (const n of Object.values(EVOLUTION_TREE)) {
      expect(n.name, `${n.id} → ${n.name} looks like a placeholder`).not.toMatch(placeholderPattern);
    }
  });

  it('names are unique across the whole tree', () => {
    const seen = new Map<string, string>();
    for (const n of Object.values(EVOLUTION_TREE)) {
      const prior = seen.get(n.name);
      expect(prior, `duplicate name "${n.name}" on ${n.id} (also on ${prior})`).toBeUndefined();
      seen.set(n.name, n.id);
    }
  });
});

describe('chooseBranch tie-breaking', () => {
  it('intensity exact tie favors primary', () => {
    const c = emptyCounts();
    c.intensity.easy = 2;
    c.intensity.hard = 2;
    expect(chooseBranch('intensity', c)).toBe('primary');
  });

  it('intensity tie with easy+medium summing to hard favors primary', () => {
    const c = emptyCounts();
    c.intensity.easy = 1;
    c.intensity.medium = 2;
    c.intensity.hard = 3;
    expect(chooseBranch('intensity', c)).toBe('primary');
  });

  it('complexity exact tie favors primary', () => {
    const c = emptyCounts();
    c.complexity.beginner = 3;
    c.complexity.advanced = 3;
    expect(chooseBranch('complexity', c)).toBe('primary');
  });

  it('complexity tie with intermediate+advanced summing to beginner favors primary', () => {
    const c = emptyCounts();
    c.complexity.beginner = 5;
    c.complexity.intermediate = 2;
    c.complexity.advanced = 3;
    expect(chooseBranch('complexity', c)).toBe('primary');
  });

  it('alt wins only when strictly greater', () => {
    const c = emptyCounts();
    c.intensity.hard = 1;
    expect(chooseBranch('intensity', c)).toBe('alt');
    c.intensity.medium = 1; // now tied
    expect(chooseBranch('intensity', c)).toBe('primary');
  });
});

describe('nextLineageId invariants', () => {
  it('never returns the input id for any non-final node', () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.stage >= 4) continue;
      const c = emptyCounts();
      // Test both directions per node.
      const primaryResult = nextLineageId(n.id, c);
      expect(primaryResult, `primary on ${n.id}`).not.toBe(n.id);
      const altC = emptyCounts();
      altC.intensity.hard = 10;
      altC.complexity.advanced = 10;
      const altResult = nextLineageId(n.id, altC);
      expect(altResult, `alt on ${n.id}`).not.toBe(n.id);
    }
  });

  it('returns a non-null child id for every non-final node (zero counts → primary)', () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.stage >= 4) continue;
      const result = nextLineageId(n.id, emptyCounts());
      expect(result, `${n.id} returned null`).not.toBeNull();
      expect(EVOLUTION_TREE[result!], `${n.id} → ${result} not in tree`).toBeDefined();
    }
  });

  it('returns a non-null child id for every non-final node (alt-skewed)', () => {
    const altC = emptyCounts();
    altC.intensity.hard = 10;
    altC.complexity.advanced = 10;
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.stage >= 4) continue;
      const result = nextLineageId(n.id, altC);
      expect(result, `${n.id} returned null under alt skew`).not.toBeNull();
      expect(EVOLUTION_TREE[result!]).toBeDefined();
    }
  });

  it('returns a child whose stage is exactly one greater than the parent', () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.stage >= 4) continue;
      const result = nextLineageId(n.id, emptyCounts())!;
      expect(EVOLUTION_TREE[result].stage).toBe(n.stage + 1);
    }
  });
});

describe('applyWorkoutResult branch projection (in-flight workout participates)', () => {
  const NOW = 1_700_000_000_000;

  it('a single in-flight hard workout flips an otherwise-empty pet onto the alt branch', () => {
    const pet = makePet({
      xp: 59, lastWorkout: null, lineageId: 'ember', line: 'ember',
      workoutCounts: { intensity: { easy: 0, medium: 0, hard: 0 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
    });
    const r = applyWorkoutResult(pet, 'hard', 'beginner', NOW);
    expect(r.evolved).not.toBeNull();
    expect(r.pet.lineageId).toBe('ember-a');
  });

  it("an in-flight easy workout breaks a prior 'hard:1' lead (tie → primary)", () => {
    // Prior counts: hard=1, easy=0. Without the in-flight workout, alt wins (1>0).
    // With the in-flight 'easy' workout projected: easy=1, hard=1 → tie → primary.
    const pet = makePet({
      xp: 59, lastWorkout: null, lineageId: 'ember', line: 'ember',
      workoutCounts: { intensity: { easy: 0, medium: 0, hard: 1 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
    });
    const r = applyWorkoutResult(pet, 'easy', 'beginner', NOW);
    expect(r.evolved).not.toBeNull();
    expect(r.pet.lineageId).toBe('ember-p');
  });

  it('uses complexity axis on stage 1→2 transitions (in-flight advanced flips primary→alt)', () => {
    // Pet at ember-p, xp 179, beginner-leaning history (1). In-flight 'advanced'
    // workout projects beginner=1, advanced=1 → tie → primary. So the cleaner
    // demonstration: prior beginner=0, advanced=0, in-flight advanced → alt=1>0 → alt.
    const pet = makePet({
      stage: 1, xp: 179, lastWorkout: null, lineageId: 'ember-p', line: 'ember',
      workoutCounts: { intensity: { easy: 0, medium: 5, hard: 0 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
    });
    const r = applyWorkoutResult(pet, 'medium', 'advanced', NOW);
    expect(r.evolved).not.toBeNull();
    expect(r.pet.lineageId).toBe('ember-pa');
  });

  it('does not change lineageId when no evolution occurs, even with branch-flipping habits', () => {
    const pet = makePet({
      xp: 0, lastWorkout: null, lineageId: 'ember-p',
      workoutCounts: { intensity: { easy: 0, medium: 0, hard: 99 }, complexity: { beginner: 0, intermediate: 0, advanced: 0 } },
    });
    const r = applyWorkoutResult(pet, 'hard', 'advanced', NOW);
    expect(r.evolved).toBeNull();
    expect(r.pet.lineageId).toBe('ember-p');
  });
});

describe('legacyLineageId clamping', () => {
  it('clamps negative stages to the line baseline', () => {
    expect(legacyLineageId('ember', -1)).toBe('ember');
    expect(legacyLineageId('tide', -99)).toBe('tide');
  });

  it('clamps stages above 4 onto the all-primary spine final', () => {
    expect(legacyLineageId('ember', 5)).toBe('ember-pppp');
    expect(legacyLineageId('verdant', 100)).toBe('verdant-pppp');
  });

  it('returns the same id for stage 4 and any over-range stage', () => {
    const lines: Line[] = ['ember', 'tide', 'verdant'];
    for (const line of lines) {
      const expected = `${line}-pppp`;
      expect(legacyLineageId(line, 4)).toBe(expected);
      expect(legacyLineageId(line, 4.9)).toBe(expected);
      expect(legacyLineageId(line, 999)).toBe(expected);
    }
  });

  it('every legacyLineageId output is a real node in the tree', () => {
    const lines: Line[] = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];
    for (const line of lines) {
      for (let s = 0; s <= 4; s++) {
        const id = legacyLineageId(line, s);
        expect(EVOLUTION_TREE[id], `${line}@${s} → ${id}`).toBeDefined();
      }
    }
  });
});

describe('roster expansion (ADR-0004 phase 3)', () => {
  it('gale + stone are present as baseline lineageIds', () => {
    expect(EVOLUTION_TREE['gale']?.name).toBe('Wisplet');
    expect(EVOLUTION_TREE['stone']?.name).toBe('Pebbling');
    expect([...BASELINE_LINEAGE_IDS]).toContain('gale');
    expect([...BASELINE_LINEAGE_IDS]).toContain('stone');
  });

  it('gale + stone spines reach a named stage-4 final', () => {
    expect(getNode('gale-pppp')?.name).toBe('Tempestar');
    expect(getNode('stone-pppp')?.name).toBe('Megalith');
  });

  it('gale + stone subtrees are fully named (no template fallback)', () => {
    const placeholderPattern = /^(Ember|Tide|Verdant|Gale|Stone) [A-Z]+$/;
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.line === 'gale' || n.line === 'stone') {
        expect(n.name, `${n.id} is a placeholder`).not.toMatch(placeholderPattern);
      }
    }
  });

  it('chooseBranch on a gale baseline returns a real child', () => {
    const c = emptyCounts();
    c.intensity.hard = 3;
    const next = nextLineageId('gale', c);
    expect(next).toBe('gale-a');
    expect(EVOLUTION_TREE[next!]?.name).toBe('Gustcub');
  });
});

describe('full grid coverage (post leaf-synthesis)', () => {
  it('every non-spine stage-4 leaf has an authored or synthesized grid', () => {
    const skip = new Set(['ember-pppp', 'tide-pppp', 'verdant-pppp', 'gale-pppp', 'stone-pppp', 'umbra-pppp', 'aurora-pppp', 'static-pppp']);
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (n.stage !== 4) continue;
      if (skip.has(n.id)) continue;
      expect(n.grid, `${n.id} still lacks a grid`).not.toBeNull();
      expect(n.grid?.length).toBe(16);
      expect(n.grid?.[0].length).toBe(16);
    }
  });

  it('every authored grid in the tree is a clean 16×16 (catches row-width typos)', () => {
    for (const n of Object.values(EVOLUTION_TREE)) {
      if (!n.grid) continue;
      expect(n.grid.length, `${n.id} row count`).toBe(16);
      for (let y = 0; y < n.grid.length; y++) {
        expect(n.grid[y].length, `${n.id} row ${y} width`).toBe(16);
      }
    }
  });

  it('synthesized leaves differ from their stage-3 parent (flourish applied)', () => {
    // Sample one leaf per line — they should NOT be byte-identical to parent.
    const samples: [string, string][] = [
      ['ember-ppa', 'ember-ppap'],
      ['tide-aaa',  'tide-aaaa'],
      ['gale-pap',  'gale-papa'],
      ['stone-app', 'stone-appp'],
      ['verdant-apa', 'verdant-apap'],
    ];
    for (const [parentId, leafId] of samples) {
      const parent = EVOLUTION_TREE[parentId].grid!.join('\n');
      const leaf = EVOLUTION_TREE[leafId].grid!.join('\n');
      expect(leaf, `${leafId} identical to ${parentId}`).not.toBe(parent);
    }
  });
});
