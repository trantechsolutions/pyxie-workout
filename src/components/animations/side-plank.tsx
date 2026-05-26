import { AnimationBase, type AnimationSize } from './AnimationBase';

export function SidePlankAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-side-plank">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-pulse">
      <rect x="8" y="22" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="26" width="32" height="4" fill="var(--text)" />
      <rect x="46" y="26" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="30" width="3" height="18" fill="var(--text-dim)" />
      <rect x="11" y="46" width="6" height="3" fill="var(--text-dim)" />
      <rect x="46" y="30" width="4" height="18" fill="var(--text)" />
      <rect x="44" y="46" width="6" height="3" fill="var(--text)" />
      <rect x="20" y="14" width="3" height="12" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
