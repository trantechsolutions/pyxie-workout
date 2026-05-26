import { AnimationBase, type AnimationSize } from './AnimationBase';

export function InclinePushUpsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-incline-push-ups">
  <rect x="4" y="50" width="56" height="2" fill="var(--border)" /><rect x="4" y="42" width="14" height="8" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="8" y="22" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="26" width="28" height="4" fill="var(--text)" />
    <rect x="42" y="26" width="4" height="4" fill="var(--text)" />
    <rect x="16" y="30" width="3" height="18" fill="var(--text-dim)" />
    <rect x="46" y="28" width="12" height="3" fill="var(--text)" />
    <rect x="56" y="31" width="3" height="18" fill="var(--text-dim)" />
    
  </g>
  
  <g className="anim-frame anim-frame-b">
    <rect x="8" y="30" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="34" width="28" height="4" fill="var(--text)" />
    <rect x="42" y="34" width="4" height="4" fill="var(--text)" />
    <rect x="16" y="36" width="3" height="4" fill="var(--text-dim)" />
    <rect x="13" y="37" width="3" height="3" fill="var(--text-dim)" />
    <rect x="46" y="36" width="12" height="3" fill="var(--text)" />
    <rect x="56" y="39" width="3" height="12" fill="var(--text-dim)" />
  </g>
    </AnimationBase>
  );
}
