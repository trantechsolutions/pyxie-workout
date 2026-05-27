import { AnimationBase, type AnimationSize } from './AnimationBase';

export function HandstandWallHoldAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-handstand-wall-hold">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <rect x="58" y="6" width="2" height="54" fill="var(--border)" />
    <g className="anim-pulse">
      <rect x="28" y="48" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="32" width="6" height="16" fill="var(--text)" />
      <rect x="27" y="20" width="4" height="14" fill="var(--text)" />
      <rect x="33" y="20" width="4" height="14" fill="var(--text)" />
      <rect x="27" y="14" width="4" height="6" fill="var(--text-dim)" />
      <rect x="33" y="14" width="4" height="6" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
