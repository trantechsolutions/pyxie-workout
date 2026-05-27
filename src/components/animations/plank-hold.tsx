import { AnimationBase, type AnimationSize } from './AnimationBase';

export function PlankHoldAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-plank-hold">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-pulse">
    <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="36" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="36" width="4" height="4" fill="var(--text)" />
    <rect x="14" y="40" width="3" height="8" fill="var(--text-dim)" />
    <rect x="11" y="46" width="6" height="3" fill="var(--text-dim)" />
    <rect x="50" y="38" width="8" height="3" fill="var(--text)" />
    <rect x="56" y="41" width="3" height="8" fill="var(--text-dim)" />
  </g>
    </AnimationBase>
  );
}
