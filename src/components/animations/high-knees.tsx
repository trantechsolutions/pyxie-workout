import { AnimationBase, type AnimationSize } from './AnimationBase';

export function HighKneesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-high-knees">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
      <rect x="22" y="20" width="3" height="10" fill="var(--text-dim)" />
      <rect x="39" y="22" width="3" height="10" fill="var(--text-dim)" />
      <rect x="20" y="28" width="6" height="6" fill="var(--text)" />
      <rect x="24" y="32" width="4" height="10" fill="var(--text)" />
      <rect x="33" y="32" width="4" height="24" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
      <rect x="39" y="20" width="3" height="10" fill="var(--text-dim)" />
      <rect x="22" y="22" width="3" height="10" fill="var(--text-dim)" />
      <rect x="38" y="28" width="6" height="6" fill="var(--text)" />
      <rect x="36" y="32" width="4" height="10" fill="var(--text)" />
      <rect x="27" y="32" width="4" height="24" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
