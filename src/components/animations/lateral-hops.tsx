import { AnimationBase, type AnimationSize } from './AnimationBase';

export function LateralHopsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-lateral-hops">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <rect x="32" y="56" width="2" height="2" fill="var(--gold)" />
    <g className="anim-frame anim-frame-a">
      <rect x="14" y="10" width="8" height="8" fill="var(--gold)" />
      <rect x="15" y="18" width="6" height="14" fill="var(--text)" />
      <rect x="11" y="20" width="3" height="10" fill="var(--text-dim)" />
      <rect x="22" y="20" width="3" height="10" fill="var(--text-dim)" />
      <rect x="13" y="32" width="4" height="24" fill="var(--text)" />
      <rect x="19" y="32" width="4" height="24" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="42" y="10" width="8" height="8" fill="var(--gold)" />
      <rect x="43" y="18" width="6" height="14" fill="var(--text)" />
      <rect x="39" y="20" width="3" height="10" fill="var(--text-dim)" />
      <rect x="50" y="20" width="3" height="10" fill="var(--text-dim)" />
      <rect x="41" y="32" width="4" height="24" fill="var(--text)" />
      <rect x="47" y="32" width="4" height="24" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
