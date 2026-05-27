import { AnimationBase, type AnimationSize } from './AnimationBase';

export function StandingKneeToElbowAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-standing-knee-to-elbow">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="28" y="6" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="14" width="6" height="14" fill="var(--text)" />
      <rect x="22" y="10" width="3" height="10" fill="var(--text-dim)" />
      <rect x="22" y="18" width="6" height="3" fill="var(--text-dim)" />
      <rect x="39" y="10" width="3" height="10" fill="var(--text-dim)" />
      <rect x="36" y="18" width="6" height="3" fill="var(--text-dim)" />
      <rect x="33" y="28" width="6" height="4" fill="var(--text)" />
      <rect x="37" y="20" width="4" height="12" fill="var(--text)" />
      <rect x="27" y="28" width="4" height="28" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="28" y="6" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="14" width="6" height="14" fill="var(--text)" />
      <rect x="22" y="10" width="3" height="10" fill="var(--text-dim)" />
      <rect x="22" y="18" width="6" height="3" fill="var(--text-dim)" />
      <rect x="39" y="10" width="3" height="10" fill="var(--text-dim)" />
      <rect x="36" y="18" width="6" height="3" fill="var(--text-dim)" />
      <rect x="25" y="28" width="6" height="4" fill="var(--text)" />
      <rect x="23" y="20" width="4" height="12" fill="var(--text)" />
      <rect x="33" y="28" width="4" height="28" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
