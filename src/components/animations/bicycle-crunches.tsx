import { AnimationBase, type AnimationSize } from './AnimationBase';

export function BicycleCrunchesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-bicycle-crunches">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="22" y="40" width="6" height="6" fill="var(--gold)" />
      <rect x="20" y="46" width="10" height="4" fill="var(--text)" />
      <rect x="28" y="44" width="6" height="3" fill="var(--text-dim)" />
      <rect x="34" y="36" width="4" height="14" fill="var(--text)" />
      <rect x="42" y="48" width="10" height="3" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="22" y="40" width="6" height="6" fill="var(--gold)" />
      <rect x="20" y="46" width="10" height="4" fill="var(--text)" />
      <rect x="28" y="48" width="6" height="3" fill="var(--text-dim)" />
      <rect x="34" y="48" width="4" height="3" fill="var(--text)" />
      <rect x="34" y="36" width="4" height="14" fill="var(--text)" />
      <rect x="38" y="36" width="14" height="3" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
