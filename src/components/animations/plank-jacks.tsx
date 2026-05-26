import { AnimationBase, type AnimationSize } from './AnimationBase';

export function PlankJacksAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-plank-jacks">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="36" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="36" width="4" height="4" fill="var(--text)" />
    <rect x="14" y="40" width="3" height="8" fill="var(--text-dim)" />
    <rect x="11" y="46" width="6" height="3" fill="var(--text-dim)" />
    <g className="anim-frame anim-frame-a">
      <rect x="50" y="38" width="3" height="10" fill="var(--text)" />
      <rect x="55" y="38" width="3" height="10" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="46" y="40" width="3" height="3" fill="var(--text)" />
      <rect x="44" y="44" width="3" height="5" fill="var(--text)" />
      <rect x="58" y="40" width="3" height="3" fill="var(--text)" />
      <rect x="59" y="44" width="3" height="5" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
