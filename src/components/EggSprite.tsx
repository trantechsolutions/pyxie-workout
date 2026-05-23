// Generic blind-box egg — single design shared by every line so the silhouette
// can't telegraph what's inside before it hatches. Sourced from
// docs/marketing/logo/pyxie-egg.svg. One fleck per roster line (8 total).
//
// 16x16 grid. Char → color:
//   C = #F5F1E8  cream shell
//   S = #C9C3D0  right-side shadow
//   O = #FF6B35  ember-orange fleck
//   B = #3DBEDC  tide-cyan fleck
//   G = #8AC34A  verdant-green fleck
//   L = #B8C5D6  gale-sky fleck
//   N = #C9A47C  stone-tan fleck
//   U = #A89BC4  umbra-violet fleck
//   A = #FFB4D8  aurora-pink fleck
//   Y = #FFEA66  static-yellow fleck
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

const COLORS: Record<string, string> = {
  C: '#F5F1E8',
  S: '#C9C3D0',
  O: '#FF6B35',
  B: '#3DBEDC',
  G: '#8AC34A',
  L: '#B8C5D6',
  N: '#C9A47C',
  U: '#A89BC4',
  A: '#FFB4D8',
  Y: '#FFEA66',
};

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
