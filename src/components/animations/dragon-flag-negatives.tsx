import { AnimationBase, type AnimationSize } from './AnimationBase';

export function DragonFlagNegativesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-dragon-flag-negatives">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
      <rect x="2" y="42" width="4" height="6" fill="var(--text-dim)" />
      <rect x="12" y="20" width="6" height="4" fill="var(--text)" />
      <rect x="18" y="24" width="6" height="4" fill="var(--text)" />
      <rect x="24" y="30" width="6" height="4" fill="var(--text)" />
      <rect x="30" y="36" width="6" height="4" fill="var(--text)" />
      <rect x="36" y="42" width="6" height="4" fill="var(--text)" />
      <rect x="42" y="44" width="14" height="4" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="6" y="50" width="6" height="6" fill="var(--gold)" />
      <rect x="2" y="46" width="4" height="6" fill="var(--text-dim)" />
      <rect x="12" y="52" width="34" height="4" fill="var(--text)" />
      <rect x="46" y="52" width="14" height="4" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
