import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Arm circles / mobility: arms slowly rotating. */
export function StretchMobilityAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-stretch-mobility">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* static body */}
      <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
      <rect x="29" y="18" width="6" height="16" fill="var(--text)" />
      <rect x="27" y="34" width="4" height="22" fill="var(--text)" />
      <rect x="33" y="34" width="4" height="22" fill="var(--text)" />
      {/* rotating arms — wrap in <g> with transform-origin at shoulders */}
      <g className="anim-rotate" style={{ transformOrigin: '32px 20px' }}>
        <rect x="30" y="18" width="4" height="14" fill="var(--text-dim)" />
        <rect x="28" y="30" width="8" height="3" fill="var(--text-dim)" />
      </g>
    </AnimationBase>
  );
}
