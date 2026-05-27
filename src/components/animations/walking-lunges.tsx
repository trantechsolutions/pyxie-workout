import { AnimationBase, type AnimationSize } from './AnimationBase';

export function WalkingLungesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-walking-lunges">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="14" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="15" y="18" width="6" height="12" fill="var(--text)" />
    <rect x="11" y="20" width="3" height="8" fill="var(--text-dim)" />
    <rect x="22" y="20" width="3" height="8" fill="var(--text-dim)" />
    <rect x="18" y="30" width="4" height="14" fill="var(--text)" />
    <rect x="26" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="22" y="44" width="4" height="3" fill="var(--text)" />
    <rect x="10" y="30" width="4" height="14" fill="var(--text)" />
    <rect x="6" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="48" y="50" width="4" height="2" fill="var(--text-dim)" />
    <rect x="52" y="50" width="4" height="2" fill="var(--text-dim)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="38" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="39" y="18" width="6" height="12" fill="var(--text)" />
    <rect x="35" y="20" width="3" height="8" fill="var(--text-dim)" />
    <rect x="46" y="20" width="3" height="8" fill="var(--text-dim)" />
    <rect x="42" y="30" width="4" height="14" fill="var(--text)" />
    <rect x="50" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="46" y="44" width="4" height="3" fill="var(--text)" />
    <rect x="34" y="30" width="4" height="14" fill="var(--text)" />
    <rect x="30" y="44" width="4" height="12" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
