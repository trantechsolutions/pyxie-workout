import { AnimationBase, type AnimationSize } from './AnimationBase';

export function JumpingJacksAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-jumping-jacks">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="20" width="3" height="12" fill="var(--text-dim)" />
    <rect x="36" y="20" width="3" height="12" fill="var(--text-dim)" />
    <rect x="28" y="32" width="3" height="24" fill="var(--text)" />
    <rect x="33" y="32" width="3" height="24" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="28" y="14" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="22" width="6" height="12" fill="var(--text)" />
    <rect x="20" y="14" width="8" height="3" fill="var(--text-dim)" />
    <rect x="18" y="10" width="3" height="8" fill="var(--text-dim)" />
    <rect x="36" y="14" width="8" height="3" fill="var(--text-dim)" />
    <rect x="43" y="10" width="3" height="8" fill="var(--text-dim)" />
    <rect x="20" y="34" width="3" height="6" fill="var(--text)" />
    <rect x="17" y="40" width="3" height="16" fill="var(--text)" />
    <rect x="41" y="34" width="3" height="6" fill="var(--text)" />
    <rect x="44" y="40" width="3" height="16" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
