import { describe, it, expect, beforeEach } from 'vitest';
import { usePyxie } from '../src/store/usePyxie';
import { EVOLUTION_TREE } from '../src/data/evolutionTree';
import type { Line } from '../src/store/types';
import { resetStore } from './helpers';

const T0 = 1_700_000_000_000;

const ALL_LINES: Line[] = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];
const STAGES = [0, 1, 2, 3, 4] as const;

// Spine id convention: stage 0 = '<line>', stage N>0 = '<line>-' + 'p'.repeat(N).
function spineId(line: Line, stage: number): string {
  return stage === 0 ? line : `${line}-${'p'.repeat(stage)}`;
}

describe('roster expansion - legacy hydrate migration across all 8 lines', () => {
  beforeEach(resetStore);

  for (const line of ALL_LINES) {
    for (const stage of STAGES) {
      it(`migrates legacy pet { line: '${line}', stage: ${stage} } onto the primary spine`, () => {
        const legacyPet = {
          name: 'Legacy',
          line,
          stage,
          hunger: 80, happiness: 80, energy: 80,
          xp: 100 * stage, streak: 1, alive: true,
          born: T0, lastDecay: T0, lastWorkout: T0, criticalSince: null,
        };
        localStorage.setItem('pyxie-state', JSON.stringify({ pet: legacyPet, history: [] }));
        usePyxie.getState().hydrate();
        const p = usePyxie.getState().pet!;
        const expected = spineId(line, stage);
        expect(p.lineageId).toBe(expected);
        expect(EVOLUTION_TREE[p.lineageId!]).toBeDefined();
        expect(EVOLUTION_TREE[p.lineageId!].line).toBe(line);
        expect(EVOLUTION_TREE[p.lineageId!].stage).toBe(stage);
      });
    }
  }
});

describe('roster expansion - stage-1 alt grids for the 5 new lines', () => {
  const NEW_LINES: Line[] = ['gale', 'stone', 'umbra', 'aurora', 'static'];

  for (const line of NEW_LINES) {
    it(`'${line}-a' has a 16x16 string grid`, () => {
      const node = EVOLUTION_TREE[`${line}-a`];
      expect(node).toBeDefined();
      expect(Array.isArray(node.grid)).toBe(true);
      expect(node.grid).toHaveLength(16);
      for (const row of node.grid as unknown as string[]) {
        expect(typeof row).toBe('string');
        expect(row).toHaveLength(16);
      }
    });
  }
});
