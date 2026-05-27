import { AnimationBase, type AnimationSize } from './AnimationBase';

export function VUpsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-v-ups">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="6" y="50" width="6" height="6" fill="var(--gold)" />
      <rect x="12" y="52" width="34" height="4" fill="var(--text)" />
      <rect x="46" y="52" width="14" height="4" fill="var(--text)" />
      <rect x="2" y="48" width="6" height="3" fill="var(--text-dim)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="28" y="42" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="50" width="14" height="4" fill="var(--text)" />
      <rect x="34" y="50" width="14" height="4" fill="var(--text)" />
      <rect x="14" y="46" width="6" height="3" fill="var(--text-dim)" />
      <rect x="20" y="44" width="6" height="3" fill="var(--text-dim)" />
      <rect x="34" y="46" width="6" height="3" fill="var(--text-dim)" />
      <rect x="40" y="44" width="6" height="3" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
