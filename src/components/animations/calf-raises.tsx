import { AnimationBase, type AnimationSize } from './AnimationBase';

export function CalfRaisesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-calf-raises">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="20" width="3" height="12" fill="var(--text-dim)" />
    <rect x="36" y="20" width="3" height="12" fill="var(--text-dim)" />
    <rect x="27" y="32" width="4" height="24" fill="var(--text)" />
    <rect x="33" y="32" width="4" height="24" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="28" y="4" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="12" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="14" width="3" height="12" fill="var(--text-dim)" />
    <rect x="36" y="14" width="3" height="12" fill="var(--text-dim)" />
    <rect x="27" y="26" width="4" height="24" fill="var(--text)" />
    <rect x="33" y="26" width="4" height="24" fill="var(--text)" />
    <rect x="27" y="50" width="10" height="4" fill="var(--text-dim)" />
    <rect x="27" y="54" width="3" height="2" fill="var(--text)" />
    <rect x="34" y="54" width="3" height="2" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
