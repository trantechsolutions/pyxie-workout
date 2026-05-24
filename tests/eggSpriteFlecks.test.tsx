import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EggSprite } from '../src/components/EggSprite';

const FLECK_COLORS: Record<string, string> = {
  ember: '#FF6B35',
  tide: '#3DBEDC',
  verdant: '#8AC34A',
  gale: '#B8C5D6',
  stone: '#C9A47C',
  umbra: '#A89BC4',
  aurora: '#FFB4D8',
  static: '#FFEA66',
};

const SHELL_COLORS = new Set(['#F5F1E8', '#C9C3D0']);

// Canonical (col, row) positions inside the 16x16 EggSprite grid.
// Pinning these guards against position drift that count/hex tests cannot catch.
const CANONICAL_FLECK_CELLS: ReadonlyArray<{
  line: string;
  col: number;
  row: number;
  hex: string;
}> = [
  { line: 'ember',   col: 6,  row: 5,  hex: '#FF6B35' },
  { line: 'tide',    col: 8,  row: 7,  hex: '#3DBEDC' },
  { line: 'verdant', col: 5,  row: 9,  hex: '#8AC34A' },
  { line: 'gale',    col: 9,  row: 10, hex: '#B8C5D6' },
  { line: 'stone',   col: 7,  row: 12, hex: '#C9A47C' },
  { line: 'umbra',   col: 4,  row: 6,  hex: '#A89BC4' },
  { line: 'aurora',  col: 9,  row: 4,  hex: '#FFB4D8' },
  { line: 'static',  col: 10, row: 9,  hex: '#FFEA66' },
];

function normalize(hex: string | null): string {
  return (hex ?? '').trim().toUpperCase();
}

describe('EggSprite — 8 line-colored flecks regression', () => {
  it('renders exactly 8 fleck cells, one per elemental line', () => {
    const { container } = render(<EggSprite />);
    const rects = Array.from(container.querySelectorAll('rect'));
    expect(rects.length).toBeGreaterThan(0);

    const fleckHexSet = new Set(Object.values(FLECK_COLORS).map((h) => h.toUpperCase()));

    const fleckRects = rects.filter((r) => fleckHexSet.has(normalize(r.getAttribute('fill'))));

    // AC #6.3 — total fleck cells === 8
    expect(fleckRects.length).toBe(8);

    // AC #6.4 — every one of the 8 hex values appears exactly once
    const counts: Record<string, number> = {};
    for (const r of fleckRects) {
      const hex = normalize(r.getAttribute('fill'));
      counts[hex] = (counts[hex] ?? 0) + 1;
    }
    for (const [line, hex] of Object.entries(FLECK_COLORS)) {
      expect(counts[hex.toUpperCase()], `expected exactly one ${line} fleck (${hex})`).toBe(1);
    }
    expect(Object.keys(counts).length).toBe(8);
  });

  it('preserves silhouette: shell + shadow cells still rendered alongside flecks', () => {
    const { container } = render(<EggSprite />);
    const rects = Array.from(container.querySelectorAll('rect'));
    const shellRects = rects.filter((r) => SHELL_COLORS.has(normalize(r.getAttribute('fill'))));
    // Egg body is substantially larger than its 8 flecks.
    expect(shellRects.length).toBeGreaterThan(40);
    // Total cell count matches the current grid contract (shell + shadow + 8 flecks).
    expect(rects.length).toBe(shellRects.length + 8);
  });

  it('pins each fleck to its canonical (col, row) cell in the 16x16 grid', () => {
    // size=160 → cell=10, keeping math exact and human-readable.
    const size = 160;
    const cell = size / 16;
    const tolerance = 1e-6;

    const { container } = render(<EggSprite size={size} />);
    const rects = Array.from(container.querySelectorAll('rect'));

    const fleckHexSet = new Set(Object.values(FLECK_COLORS).map((h) => h.toUpperCase()));
    const fleckRects = rects.filter((r) => fleckHexSet.has(normalize(r.getAttribute('fill'))));

    // Sanity: still exactly 8 flecks at this render size.
    expect(fleckRects.length).toBe(8);

    for (const { line, col, row, hex } of CANONICAL_FLECK_CELLS) {
      const expectedHex = hex.toUpperCase();
      const expectedX = col * cell;
      const expectedY = row * cell;

      const matches = fleckRects.filter((r) => {
        if (normalize(r.getAttribute('fill')) !== expectedHex) return false;
        const x = parseFloat(r.getAttribute('x') ?? 'NaN');
        const y = parseFloat(r.getAttribute('y') ?? 'NaN');
        return Math.abs(x - expectedX) < tolerance && Math.abs(y - expectedY) < tolerance;
      });

      expect(
        matches.length,
        `expected exactly one ${line} fleck (${hex}) at cell (col=${col}, row=${row}) → (x=${expectedX}, y=${expectedY})`
      ).toBe(1);
    }
  });
});
