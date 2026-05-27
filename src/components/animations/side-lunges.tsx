import { AnimationBase, type AnimationSize } from './AnimationBase';

export function SideLungesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-side-lunges">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="8" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="16" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="18" width="3" height="10" fill="var(--text-dim)" />
    <rect x="36" y="18" width="3" height="10" fill="var(--text-dim)" />
    <rect x="14" y="30" width="6" height="6" fill="var(--text)" />
    <rect x="16" y="36" width="4" height="20" fill="var(--text)" />
    <rect x="33" y="30" width="4" height="26" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="28" y="8" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="16" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="18" width="3" height="10" fill="var(--text-dim)" />
    <rect x="36" y="18" width="3" height="10" fill="var(--text-dim)" />
    <rect x="44" y="30" width="6" height="6" fill="var(--text)" />
    <rect x="44" y="36" width="4" height="20" fill="var(--text)" />
    <rect x="27" y="30" width="4" height="26" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
