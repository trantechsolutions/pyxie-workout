import { AnimationBase, type AnimationSize } from './AnimationBase';

export function ToeTouchesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-toe-touches">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="6" y="50" width="6" height="6" fill="var(--gold)" />
      <rect x="12" y="52" width="22" height="4" fill="var(--text)" />
      <rect x="34" y="52" width="4" height="4" fill="var(--text)" />
      <rect x="34" y="34" width="4" height="18" fill="var(--text)" />
      <rect x="14" y="48" width="3" height="4" fill="var(--text-dim)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="14" y="40" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="46" width="22" height="4" fill="var(--text)" />
      <rect x="36" y="50" width="4" height="4" fill="var(--text)" />
      <rect x="34" y="34" width="4" height="18" fill="var(--text)" />
      <rect x="20" y="36" width="6" height="3" fill="var(--text-dim)" />
      <rect x="26" y="34" width="6" height="3" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
