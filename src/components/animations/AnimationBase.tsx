import type { ReactNode } from 'react';

export type AnimationSize = 'sm' | 'md';

const SIZE_PX: Record<AnimationSize, number> = {
  sm: 72,
  md: 110,
};

interface Props {
  size?: AnimationSize;
  className?: string;
  children: ReactNode;
  viewBox?: string;
}

/**
 * Shared SVG wrapper for movement-pattern animations.
 * Pixel-art stick figure on a transparent ground; uses `shape-rendering: crispEdges`
 * to keep the hard pixel feel consistent with Sprite.tsx.
 */
export function AnimationBase({ size = 'md', className = '', children, viewBox = '0 0 64 64' }: Props) {
  const px = SIZE_PX[size];
  return (
    <svg
      className={`exercise-anim ${className}`}
      width={px}
      height={px}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
