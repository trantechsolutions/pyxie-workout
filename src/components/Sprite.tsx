import type { Line } from '../store/types';
import { CREATURES, PALETTES } from '../data/creatures';
import { EVOLUTION_TREE, legacyLineageId } from '../data/evolutionTree';

interface Props {
  line: Line;
  stage: number;
  size?: number;
  onClick?: () => void;
  /** Optional tree lineageId. When omitted, falls back to the legacy linear lookup. */
  lineageId?: string;
  /** Optional per-pet seed (typically `pet.born`). Drives a small hue rotation
   *  so two pets of the same lineageId still look visually distinct. */
  seed?: number;
}

// Map an arbitrary integer seed to a small hue-rotation in degrees. Range is
// intentionally narrow (±18°) so palette identity is preserved — an ember
// stays ember, just with a personal tint. Pure white and black are unaffected
// by hue rotation, so eye highlights remain crisp.
function hueDegFromSeed(seed: number): number {
  // Mix bits so adjacent born timestamps don't produce visually similar shifts.
  const mixed = ((seed ^ (seed >>> 7)) * 2654435761) >>> 0;
  return (mixed % 37) - 18; // -18..+18
}

/**
 * Resolve a 16x16 grid for the given lineage/line/stage.
 * Priority:
 *   1. Authored grid on the EVOLUTION_TREE node.
 *   2. Legacy CREATURES[line][stage] (the all-primary spine).
 *   3. Authored grid of the nearest ancestor on the spine (procedural placeholder).
 */
function resolveGrid(line: Line, stage: number, lineageId?: string): { grid: string[]; placeholder: boolean } {
  if (lineageId) {
    const node = EVOLUTION_TREE[lineageId];
    if (node?.grid) return { grid: node.grid, placeholder: false };
  }
  // Walk down the canonical spine until we find an authored grid at this stage.
  const fallbackId = lineageId ?? legacyLineageId(line, stage);
  const fallbackNode = EVOLUTION_TREE[fallbackId];
  if (fallbackNode?.grid) return { grid: fallbackNode.grid, placeholder: false };
  // Final fallback — the original linear CREATURES table. Always authored for the spine.
  const clamped = Math.max(0, Math.min(4, stage));
  return { grid: CREATURES[line][clamped].grid, placeholder: !!lineageId && lineageId !== legacyLineageId(line, stage) };
}

export function Sprite({ line, stage, size = 200, onClick, lineageId, seed }: Props) {
  const { grid, placeholder } = resolveGrid(line, stage, lineageId);
  const palette = PALETTES[line];
  const hueDeg = typeof seed === 'number' ? hueDegFromSeed(seed) : 0;
  const cell = size / 16;
  const rects: JSX.Element[] = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      let color: string;
      if (ch === '7') color = '#ffffff';
      else if (ch === '8') color = '#0a0a0a';
      else color = palette[parseInt(ch, 10) - 1] ?? '#888';
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
  // Placeholder badge: small marker in the corner so art-pending nodes are visibly distinct.
  const badge = placeholder ? (
    <g>
      <rect x={size - cell * 3} y={size - cell * 3} width={cell * 2.5} height={cell * 2.5} fill="#000" opacity={0.55} rx={1} />
      <text
        x={size - cell * 1.75}
        y={size - cell * 1.05}
        textAnchor="middle"
        fill="#ffd866"
        fontSize={cell * 1.6}
        fontFamily="monospace"
        fontWeight="bold"
      >?</text>
    </g>
  ) : null;
  const svgStyle: React.CSSProperties = {
    ...(onClick ? { cursor: 'pointer' as const } : {}),
    ...(hueDeg !== 0 ? { filter: `hue-rotate(${hueDeg}deg)` } : {}),
  };
  return (
    <svg
      className={`pet-sprite${placeholder ? ' pet-sprite-placeholder' : ''}`}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      onClick={onClick}
      style={Object.keys(svgStyle).length ? svgStyle : undefined}
    >
      {rects}
      {badge}
    </svg>
  );
}
