import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Squat: standing and squatted poses cycling. */
export function SquatAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-squat">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* FRAME A — standing */}
      <g className="anim-frame anim-frame-a">
        {/* head */}
        <rect x="28" y="6" width="8" height="8" fill="var(--gold)" />
        {/* torso */}
        <rect x="29" y="14" width="6" height="14" fill="var(--text)" />
        {/* arms down */}
        <rect x="25" y="16" width="3" height="10" fill="var(--text-dim)" />
        <rect x="36" y="16" width="3" height="10" fill="var(--text-dim)" />
        {/* legs straight */}
        <rect x="27" y="28" width="4" height="28" fill="var(--text)" />
        <rect x="33" y="28" width="4" height="28" fill="var(--text)" />
      </g>
      {/* FRAME B — squatted */}
      <g className="anim-frame anim-frame-b">
        <rect x="28" y="18" width="8" height="8" fill="var(--gold)" />
        <rect x="29" y="26" width="6" height="10" fill="var(--text)" />
        {/* arms forward */}
        <rect x="36" y="26" width="8" height="3" fill="var(--text-dim)" />
        <rect x="20" y="26" width="8" height="3" fill="var(--text-dim)" />
        {/* upper legs (thighs out wider) */}
        <rect x="22" y="36" width="6" height="6" fill="var(--text)" />
        <rect x="36" y="36" width="6" height="6" fill="var(--text)" />
        {/* lower legs (shins) */}
        <rect x="22" y="42" width="4" height="14" fill="var(--text)" />
        <rect x="38" y="42" width="4" height="14" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
