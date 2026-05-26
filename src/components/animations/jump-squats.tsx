import { AnimationBase, type AnimationSize } from './AnimationBase';

export function JumpSquatsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-jump-squats">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="28" y="18" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="26" width="6" height="10" fill="var(--text)" />
      <rect x="22" y="34" width="6" height="3" fill="var(--text-dim)" />
      <rect x="36" y="34" width="6" height="3" fill="var(--text-dim)" />
      <rect x="22" y="36" width="6" height="6" fill="var(--text)" />
      <rect x="36" y="36" width="6" height="6" fill="var(--text)" />
      <rect x="22" y="42" width="4" height="14" fill="var(--text)" />
      <rect x="38" y="42" width="4" height="14" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="28" y="2" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="10" width="6" height="14" fill="var(--text)" />
      <rect x="22" y="4" width="3" height="12" fill="var(--text-dim)" />
      <rect x="39" y="4" width="3" height="12" fill="var(--text-dim)" />
      <rect x="27" y="24" width="4" height="14" fill="var(--text)" />
      <rect x="33" y="24" width="4" height="14" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
