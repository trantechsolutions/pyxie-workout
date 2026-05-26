import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Static hold (wall sit, L-sit, handstand wall hold) with breathing pulse. */
export function HoldAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-hold">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* wall */}
      <rect x="4" y="6" width="2" height="54" fill="var(--border)" />
      <g className="anim-pulse">
        {/* back against wall */}
        <rect x="8" y="20" width="8" height="8" fill="var(--gold)" />
        {/* torso vertical */}
        <rect x="9" y="28" width="6" height="14" fill="var(--text)" />
        {/* thighs horizontal */}
        <rect x="15" y="38" width="16" height="4" fill="var(--text)" />
        {/* shins vertical down */}
        <rect x="29" y="42" width="4" height="14" fill="var(--text)" />
        {/* arms forward */}
        <rect x="15" y="30" width="10" height="3" fill="var(--text-dim)" />
      </g>
    </AnimationBase>
  );
}
