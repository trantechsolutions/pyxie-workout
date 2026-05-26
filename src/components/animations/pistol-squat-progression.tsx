import { AnimationBase, type AnimationSize } from './AnimationBase';

export function PistolSquatProgressionAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-pistol-squat-progression">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <rect x="40" y="42" width="18" height="14" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="28" y="6" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="14" width="6" height="14" fill="var(--text)" />
    <rect x="36" y="20" width="10" height="3" fill="var(--text-dim)" />
    <rect x="20" y="20" width="6" height="3" fill="var(--text-dim)" />
    <rect x="29" y="28" width="4" height="28" fill="var(--text)" />
    <rect x="34" y="28" width="4" height="14" fill="var(--text)" />
    <rect x="38" y="40" width="10" height="3" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="28" y="22" width="8" height="8" fill="var(--gold)" />
    <rect x="29" y="30" width="6" height="10" fill="var(--text)" />
    <rect x="36" y="32" width="14" height="3" fill="var(--text-dim)" />
    <rect x="20" y="32" width="6" height="3" fill="var(--text-dim)" />
    <rect x="26" y="40" width="8" height="6" fill="var(--text)" />
    <rect x="26" y="46" width="4" height="10" fill="var(--text)" />
    <rect x="34" y="40" width="4" height="6" fill="var(--text)" />
    <rect x="38" y="42" width="12" height="3" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
