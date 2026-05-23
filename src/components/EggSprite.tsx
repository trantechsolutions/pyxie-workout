import type { Line } from '../store/types';
import { PALETTES } from '../data/creatures';

// 16x16 egg silhouette. Cells: 2 = shell base, 3 = outline, 1 = highlight, 7 = white spot.
const EGG_GRID: string[] = [
  '................',
  '................',
  '......3333......',
  '.....322221.....',
  '....32222221....',
  '...3222222231...',
  '..32222171221...',
  '..32222117121...',
  '..32222221221...',
  '..32222222221...',
  '..32227222221...',
  '..32222222221...',
  '...3222222231...',
  '....32222231....',
  '.....322231.....',
  '......3331......',
];

interface Props {
  line: Line;
  size?: number;
}

export function EggSprite({ line, size = 120 }: Props) {
  const palette = PALETTES[line];
  const cell = size / 16;
  const rects: JSX.Element[] = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = EGG_GRID[y][x];
      if (ch === '.') continue;
      const color = ch === '7' ? '#ffffff' : palette[parseInt(ch, 10) - 1] ?? '#888';
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
