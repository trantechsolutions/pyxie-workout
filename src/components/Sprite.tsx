import type { Line } from '../store/types';
import { LINE_REGISTRY } from '../data/lineRegistry';
import { resolveGrid } from '../data/evolutionTree';
import { renderGrid } from '../lib/spriteRenderer';

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

export function Sprite({ line, stage, size = 200, onClick, lineageId, seed }: Props) {
  const { grid, placeholder } = resolveGrid(line, stage, lineageId);
  const palette = LINE_REGISTRY[line].palette;
  const hueDeg = typeof seed === 'number' ? hueDegFromSeed(seed) : 0;
  const cell = size / 16;
  const rendered = renderGrid(grid, palette, [], { size });
  const rects = rendered.map((r, i) => (
    <rect
      key={i}
      x={r.x}
      y={r.y}
      width={r.w}
      height={r.h}
      fill={r.fill}
    />
  ));
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
