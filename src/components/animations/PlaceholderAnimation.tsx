import { AnimationBase, type AnimationSize } from './AnimationBase';

/**
 * Fallback when an animationId has no registered component.
 * Tiny static figure — head + torso — so unknown ids degrade gracefully.
 */
export function PlaceholderAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-placeholder">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      <g className="anim-pulse">
        <rect x="28" y="14" width="8" height="8" fill="var(--gold)" />
        <rect x="29" y="22" width="6" height="22" fill="var(--text)" />
        <rect x="27" y="44" width="4" height="14" fill="var(--text)" />
        <rect x="33" y="44" width="4" height="14" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
