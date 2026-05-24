import { describe, it, expect } from 'vitest';
import { renderGrid, withLeafFlourish, rectsToSvg } from '../src/lib/spriteRenderer';
import { LINE_REGISTRY, parseGrid, PALETTE_WHITE, PALETTE_BLACK } from '../src/data/lineRegistry';
import { EVOLUTION_TREE, resolveGrid } from '../src/data/evolutionTree';
import type { Line } from '../src/store/types';

const LINES: Line[] = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];

describe('parseGrid', () => {
  it('accepts a valid 16×16 grid', () => {
    const rows = Array(16).fill('................');
    expect(() => parseGrid(rows)).not.toThrow();
  });

  it('rejects wrong row count', () => {
    expect(() => parseGrid(Array(15).fill('................'))).toThrow();
  });

  it('rejects wrong column count', () => {
    const rows = Array(16).fill('...............');
    expect(() => parseGrid(rows)).toThrow();
  });

  it('rejects disallowed chars', () => {
    const rows = Array(16).fill('................');
    rows[0] = '...............X';
    expect(() => parseGrid(rows)).toThrow();
  });
});

describe('renderGrid', () => {
  it('renders palette indices 1–6 to LINE_REGISTRY palette slots', () => {
    const grid = parseGrid([
      '123456..........',
      ...Array(15).fill('................'),
    ]);
    const palette = LINE_REGISTRY.ember.palette;
    const rects = renderGrid(grid, palette);
    expect(rects).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      expect(rects[i].fill).toBe(palette[i]);
    }
  });

  it('renders char "7" as renderer-constant white and "8" as renderer-constant black', () => {
    const grid = parseGrid([
      '78..............',
      ...Array(15).fill('................'),
    ]);
    const rects = renderGrid(grid, LINE_REGISTRY.ember.palette);
    expect(rects).toHaveLength(2);
    expect(rects[0].fill).toBe(PALETTE_WHITE);
    expect(rects[1].fill).toBe(PALETTE_BLACK);
  });

  it('skips empty (".") cells', () => {
    const grid = parseGrid(Array(16).fill('................'));
    expect(renderGrid(grid, LINE_REGISTRY.ember.palette)).toHaveLength(0);
  });
});

describe('withLeafFlourish transform', () => {
  it('adds primary crown cells on row 0', () => {
    const blank = parseGrid(Array(16).fill('................'));
    const out = withLeafFlourish('p')(blank);
    // Row 0 should have a few `5` cells added.
    expect(out[0].includes('5')).toBe(true);
  });

  it('adds alt shadow spikes on row 15', () => {
    const blank = parseGrid(Array(16).fill('................'));
    const out = withLeafFlourish('a')(blank);
    expect(out[15].includes('4')).toBe(true);
  });
});

describe('renderer ↔ EVOLUTION_TREE parity (ADR-0005 AC #1)', () => {
  // Spot-check: every authored node's grid passes parseGrid + renderGrid
  // without throwing, and produces a non-empty rect set when rasterized.
  it('renders every authored EVOLUTION_TREE node', () => {
    const ids = Object.keys(EVOLUTION_TREE);
    let rendered = 0;
    for (const id of ids) {
      const node = EVOLUTION_TREE[id];
      if (!node.grid) continue;
      const grid = parseGrid(node.grid, id);
      const rects = renderGrid(grid, LINE_REGISTRY[node.line].palette, [], { size: 16 });
      expect(rects.length).toBeGreaterThan(0);
      rendered++;
    }
    expect(rendered).toBeGreaterThan(0);
  });

  it('resolveGrid returns a renderable grid for every line at every stage', () => {
    for (const line of LINES) {
      for (let stage = 0; stage <= 4; stage++) {
        const { grid } = resolveGrid(line, stage);
        const rects = renderGrid(grid, LINE_REGISTRY[line].palette);
        expect(rects.length).toBeGreaterThan(0);
      }
    }
  });

  it('resolveGrid returns placeholder=true for an unknown lineageId', () => {
    const { placeholder } = resolveGrid('ember', 2, 'ember-zzzzzz');
    expect(placeholder).toBe(true);
  });
});

describe('rectsToSvg', () => {
  it('produces a well-formed SVG string with a header and rects', () => {
    const grid = parseGrid([
      '1...............',
      ...Array(15).fill('................'),
    ]);
    const rects = renderGrid(grid, LINE_REGISTRY.ember.palette, [], { size: 16 });
    const svg = rectsToSvg(rects, 16);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('<rect');
    expect(svg).toContain(LINE_REGISTRY.ember.palette[0]);
  });
});
