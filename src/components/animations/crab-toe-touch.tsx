import { AnimationBase, type AnimationSize } from './AnimationBase';

export function CrabToeTouchAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-crab-toe-touch">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="14" y="14" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="20" width="22" height="4" fill="var(--text)" />
      <rect x="34" y="20" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="24" width="3" height="14" fill="var(--text-dim)" />
      <rect x="11" y="36" width="6" height="3" fill="var(--text-dim)" />
      <rect x="38" y="20" width="4" height="14" fill="var(--text)" />
      <rect x="38" y="34" width="14" height="4" fill="var(--text)" />
      <rect x="42" y="20" width="4" height="14" fill="var(--text)" />
      <rect x="42" y="34" width="6" height="4" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="14" y="14" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="20" width="22" height="4" fill="var(--text)" />
      <rect x="34" y="20" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="24" width="3" height="14" fill="var(--text-dim)" />
      <rect x="11" y="36" width="6" height="3" fill="var(--text-dim)" />
      <rect x="22" y="24" width="6" height="3" fill="var(--text-dim)" />
      <rect x="28" y="20" width="6" height="3" fill="var(--text-dim)" />
      <rect x="38" y="20" width="4" height="14" fill="var(--text)" />
      <rect x="38" y="34" width="14" height="4" fill="var(--text)" />
      <rect x="42" y="6" width="4" height="14" fill="var(--text)" />
      <rect x="40" y="2" width="6" height="6" fill="var(--gold)" />
    </g>
    </AnimationBase>
  );
}
