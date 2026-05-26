import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Crunch / sit-up: lying down and curled up cycling. */
export function CoreDynamicAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-core-dynamic">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* FRAME A — flat */}
      <g className="anim-frame anim-frame-a">
        {/* head */}
        <rect x="6" y="50" width="6" height="6" fill="var(--gold)" />
        {/* torso flat */}
        <rect x="12" y="52" width="22" height="4" fill="var(--text)" />
        {/* arms by sides */}
        <rect x="14" y="48" width="3" height="4" fill="var(--text-dim)" />
        {/* bent knees up */}
        <rect x="34" y="48" width="4" height="8" fill="var(--text)" />
        <rect x="38" y="44" width="4" height="4" fill="var(--text)" />
        {/* shins */}
        <rect x="42" y="44" width="4" height="12" fill="var(--text)" />
      </g>
      {/* FRAME B — curled up */}
      <g className="anim-frame anim-frame-b">
        {/* head lifted */}
        <rect x="22" y="38" width="6" height="6" fill="var(--gold)" />
        {/* curled torso */}
        <rect x="20" y="44" width="6" height="4" fill="var(--text)" />
        <rect x="22" y="48" width="8" height="4" fill="var(--text)" />
        <rect x="28" y="50" width="8" height="4" fill="var(--text)" />
        {/* arms reaching forward */}
        <rect x="28" y="42" width="6" height="3" fill="var(--text-dim)" />
        <rect x="32" y="45" width="6" height="3" fill="var(--text-dim)" />
        {/* knees up (same) */}
        <rect x="36" y="46" width="4" height="8" fill="var(--text)" />
        <rect x="40" y="42" width="4" height="4" fill="var(--text)" />
        <rect x="44" y="42" width="4" height="14" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
