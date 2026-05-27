import { AnimationBase, type AnimationSize } from './AnimationBase';

export function BirdDogsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-bird-dogs">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <rect x="16" y="36" width="3" height="14" fill="var(--text-dim)" />
  <rect x="14" y="48" width="7" height="2" fill="var(--text-dim)" />
  <rect x="44" y="36" width="3" height="14" fill="var(--text-dim)" />
  <rect x="42" y="48" width="7" height="2" fill="var(--text-dim)" />
  <g className="anim-frame anim-frame-a">
    <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="34" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="34" width="4" height="4" fill="var(--text)" />
    <rect x="2" y="30" width="6" height="3" fill="var(--text-dim)" />
    <rect x="50" y="36" width="10" height="3" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="34" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="34" width="4" height="4" fill="var(--text)" />
    <rect x="2" y="36" width="6" height="3" fill="var(--text-dim)" />
    <rect x="50" y="30" width="10" height="3" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
