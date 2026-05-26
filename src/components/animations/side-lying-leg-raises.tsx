import { AnimationBase, type AnimationSize } from './AnimationBase';

export function SideLyingLegRaisesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-side-lying-leg-raises">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="6" y="44" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="46" width="22" height="4" fill="var(--text)" />
    <rect x="34" y="46" width="4" height="4" fill="var(--text)" />
    <rect x="6" y="42" width="3" height="6" fill="var(--text-dim)" />
    <rect x="38" y="48" width="22" height="4" fill="var(--text)" />
    <rect x="38" y="44" width="20" height="4" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="6" y="44" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="46" width="22" height="4" fill="var(--text)" />
    <rect x="34" y="46" width="4" height="4" fill="var(--text)" />
    <rect x="6" y="42" width="3" height="6" fill="var(--text-dim)" />
    <rect x="38" y="48" width="22" height="4" fill="var(--text)" />
    <rect x="38" y="30" width="20" height="4" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
