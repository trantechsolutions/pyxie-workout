import { AnimationBase, type AnimationSize } from './AnimationBase';

export function SingleLegHipHingeAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-single-leg-hip-hinge">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="20" width="3" height="12" fill="var(--text-dim)" />
    <rect x="36" y="20" width="3" height="12" fill="var(--text-dim)" />
    <rect x="29" y="32" width="4" height="24" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="8" y="30" width="8" height="8" fill="var(--gold)" />
    <rect x="16" y="32" width="20" height="4" fill="var(--text)" />
    <rect x="36" y="32" width="4" height="4" fill="var(--text)" />
    <rect x="16" y="36" width="3" height="8" fill="var(--text-dim)" />
    <rect x="22" y="36" width="3" height="8" fill="var(--text-dim)" />
    <rect x="38" y="36" width="4" height="20" fill="var(--text)" />
    <rect x="42" y="30" width="14" height="4" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
