import { AnimationBase, type AnimationSize } from './AnimationBase';

export function HollowBodyRocksAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-hollow-body-rocks">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="10" y="42" width="6" height="6" fill="var(--gold)" />
      <rect x="6" y="40" width="6" height="3" fill="var(--text-dim)" />
      <rect x="16" y="46" width="20" height="4" fill="var(--text)" />
      <rect x="36" y="44" width="14" height="4" fill="var(--text)" />
      <rect x="50" y="40" width="6" height="4" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="10" y="46" width="6" height="6" fill="var(--gold)" />
      <rect x="6" y="46" width="6" height="3" fill="var(--text-dim)" />
      <rect x="16" y="48" width="20" height="4" fill="var(--text)" />
      <rect x="36" y="46" width="14" height="4" fill="var(--text)" />
      <rect x="50" y="42" width="6" height="4" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
