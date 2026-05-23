// Generic blind-box egg — single design shared by every line so the silhouette
// can't telegraph what's inside before it hatches. Sourced from
// docs/marketing/logo/pyxie-egg.svg. One fleck per roster line.
//
// Shell + shadow chars are local to this file; per-line fleck chars and colors
// derive from `LINE_REGISTRY[line].eggFleck` (ADR-0005). Adding a 9th line
// only requires choosing a free fleck char and slotting it into this grid.
import type { Line } from '../store/types';
import { LINE_REGISTRY } from '../data/lineRegistry';

const SHELL_CHAR = 'C';
const SHADOW_CHAR = 'S';

const EGG_GRID: string[] = [
  '................',
  '................',
  '.......CC.......',
  '......CCCC......',
  '.....CCCCAS.....',
  '....CCOCCCCS....',
  '....UCCCCCCS....',
  '....CCCCBCCS....',
  '....CCCCCCCS....',
  '....CGCCCCYS....',
  '....CCCCCLCS....',
  '....CCCCCCCS....',
  '.....CCNCCS.....',
  '......CCCS......',
  '................',
  '................',
];

const COLORS: Record<string, string> = (() => {
  const out: Record<string, string> = {
    [SHELL_CHAR]: '#F5F1E8',
    [SHADOW_CHAR]: '#C9C3D0',
  };
  for (const line of Object.keys(LINE_REGISTRY) as Line[]) {
    const { char, color } = LINE_REGISTRY[line].eggFleck;
    out[char] = color;
  }
  return out;
})();

interface Props {
  size?: number;
}

export function EggSprite({ size = 120 }: Props) {
  const cell = size / 16;
  const rects: JSX.Element[] = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = EGG_GRID[y][x];
      if (ch === '.') continue;
      const color = COLORS[ch];
      if (!color) continue;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * cell}
          y={y * cell}
          width={cell + 0.5}
          height={cell + 0.5}
          fill={color}
        />
      );
    }
  }
  return (
    <svg
      className="pet-sprite egg-sprite"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {rects}
    </svg>
  );
}
