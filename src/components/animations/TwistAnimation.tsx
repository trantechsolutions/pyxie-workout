import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Side-bend / twist: torso leans one side then the other. */
export function TwistAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-twist">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* shared legs */}
      <rect x="27" y="40" width="4" height="16" fill="var(--text)" />
      <rect x="33" y="40" width="4" height="16" fill="var(--text)" />
      {/* FRAME A — lean left */}
      <g className="anim-frame anim-frame-a">
        <rect x="20" y="6" width="8" height="8" fill="var(--gold)" />
        <rect x="22" y="14" width="8" height="4" fill="var(--text)" />
        <rect x="26" y="18" width="8" height="4" fill="var(--text)" />
        <rect x="29" y="22" width="6" height="18" fill="var(--text)" />
        {/* arm up overhead (lean) */}
        <rect x="14" y="10" width="8" height="3" fill="var(--text-dim)" />
        <rect x="11" y="6" width="3" height="6" fill="var(--text-dim)" />
        {/* opposite arm down */}
        <rect x="35" y="22" width="3" height="12" fill="var(--text-dim)" />
      </g>
      {/* FRAME B — lean right */}
      <g className="anim-frame anim-frame-b">
        <rect x="36" y="6" width="8" height="8" fill="var(--gold)" />
        <rect x="34" y="14" width="8" height="4" fill="var(--text)" />
        <rect x="30" y="18" width="8" height="4" fill="var(--text)" />
        <rect x="29" y="22" width="6" height="18" fill="var(--text)" />
        <rect x="42" y="10" width="8" height="3" fill="var(--text-dim)" />
        <rect x="50" y="6" width="3" height="6" fill="var(--text-dim)" />
        <rect x="26" y="22" width="3" height="12" fill="var(--text-dim)" />
      </g>
    </AnimationBase>
  );
}
