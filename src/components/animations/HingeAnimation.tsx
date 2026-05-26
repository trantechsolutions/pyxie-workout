import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Hip hinge / glute bridge: hips down and hips up cycling. */
export function HingeAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-hinge">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* FRAME A — flat on back, hips down */}
      <g className="anim-frame anim-frame-a">
        {/* head */}
        <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
        {/* back/torso flat */}
        <rect x="12" y="50" width="20" height="4" fill="var(--text)" />
        {/* hips (down on floor) */}
        <rect x="32" y="50" width="4" height="4" fill="var(--text)" />
        {/* thighs angled up to knees */}
        <rect x="36" y="44" width="6" height="4" fill="var(--text)" />
        {/* shins down to feet */}
        <rect x="40" y="48" width="4" height="8" fill="var(--text)" />
      </g>
      {/* FRAME B — bridge: hips lifted */}
      <g className="anim-frame anim-frame-b">
        <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
        {/* torso angles up */}
        <rect x="12" y="46" width="6" height="4" fill="var(--text)" />
        <rect x="18" y="42" width="6" height="4" fill="var(--text)" />
        <rect x="24" y="38" width="6" height="4" fill="var(--text)" />
        {/* hips lifted */}
        <rect x="30" y="36" width="6" height="4" fill="var(--text)" />
        {/* thighs angled down */}
        <rect x="36" y="40" width="6" height="4" fill="var(--text)" />
        {/* shins down */}
        <rect x="40" y="44" width="4" height="12" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
