import { AnimationBase, type AnimationSize } from './AnimationBase';

export function SquatHoldPulsesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-squat-hold-pulses">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="6" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="14" width="6" height="14" fill="var(--text)" />
    <rect x="25" y="16" width="3" height="10" fill="var(--text-dim)" />
    <rect x="36" y="16" width="3" height="10" fill="var(--text-dim)" />
    <rect x="25" y="28" width="4" height="28" fill="var(--text)" />
    <rect x="35" y="28" width="4" height="28" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="28" y="18" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="26" width="6" height="10" fill="var(--text)" />
    <rect x="36" y="26" width="8" height="3" fill="var(--text-dim)" />
    <rect x="20" y="26" width="8" height="3" fill="var(--text-dim)" />
    <rect x="18" y="36" width="6" height="6" fill="var(--text)" />
    <rect x="40" y="36" width="6" height="6" fill="var(--text)" />
    <rect x="18" y="42" width="4" height="14" fill="var(--text)" />
    <rect x="42" y="42" width="4" height="14" fill="var(--text)" />
    
  </g>
    </AnimationBase>
  );
}
