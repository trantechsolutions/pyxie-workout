import { AnimationBase, type AnimationSize } from './AnimationBase';

export function CurtsyLungesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-curtsy-lunges">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="20" width="3" height="10" fill="var(--text-dim)" />
    <rect x="36" y="20" width="3" height="10" fill="var(--text-dim)" />
    <rect x="29" y="32" width="4" height="14" fill="var(--text)" />
    <rect x="29" y="46" width="8" height="3" fill="var(--text)" />
    <rect x="22" y="34" width="4" height="6" fill="var(--text)" />
    <rect x="34" y="40" width="4" height="16" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="20" width="3" height="10" fill="var(--text-dim)" />
    <rect x="36" y="20" width="3" height="10" fill="var(--text-dim)" />
    <rect x="31" y="32" width="4" height="14" fill="var(--text)" />
    <rect x="27" y="46" width="8" height="3" fill="var(--text)" />
    <rect x="38" y="34" width="4" height="6" fill="var(--text)" />
    <rect x="26" y="40" width="4" height="16" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
