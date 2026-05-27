import { AnimationBase, type AnimationSize } from './AnimationBase';

export function VUpBurpeeAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-v-up-burpee"><rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-burpee-frame anim-burpee-1">
      <rect x="28" y="14" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="22" width="6" height="14" fill="var(--text)" />
      <rect x="25" y="24" width="3" height="10" fill="var(--text-dim)" />
      <rect x="36" y="24" width="3" height="10" fill="var(--text-dim)" />
      <rect x="27" y="36" width="4" height="20" fill="var(--text)" />
      <rect x="33" y="36" width="4" height="20" fill="var(--text)" />
    </g>
    <g className="anim-burpee-frame anim-burpee-2">
      <rect x="28" y="28" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="36" width="6" height="8" fill="var(--text)" />
      <rect x="20" y="42" width="10" height="3" fill="var(--text-dim)" />
      <rect x="34" y="42" width="10" height="3" fill="var(--text-dim)" />
      <rect x="24" y="44" width="6" height="6" fill="var(--text)" />
      <rect x="34" y="44" width="6" height="6" fill="var(--text)" />
      <rect x="24" y="50" width="4" height="6" fill="var(--text)" />
      <rect x="36" y="50" width="4" height="6" fill="var(--text)" />
    </g>
    <g className="anim-burpee-frame anim-burpee-3">
      <rect x="28" y="42" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="50" width="14" height="4" fill="var(--text)" />
      <rect x="34" y="50" width="14" height="4" fill="var(--text)" />
      <rect x="14" y="46" width="6" height="3" fill="var(--text-dim)" />
      <rect x="34" y="46" width="6" height="3" fill="var(--text-dim)" />
    </g>
    <g className="anim-burpee-frame anim-burpee-4">
      <rect x="28" y="6" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="14" width="6" height="14" fill="var(--text)" />
      <rect x="22" y="2" width="3" height="14" fill="var(--text-dim)" />
      <rect x="39" y="2" width="3" height="14" fill="var(--text-dim)" />
      <rect x="27" y="28" width="4" height="14" fill="var(--text)" />
      <rect x="33" y="28" width="4" height="14" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
