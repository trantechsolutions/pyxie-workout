import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Mountain climber / plank with alternating knee drive. */
export function PlankDynamicAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-plank-dynamic">
      <rect x="4" y="50" width="56" height="2" fill="var(--border)" />
      {/* shared static plank body */}
      <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="36" width="32" height="4" fill="var(--text)" />
      <rect x="46" y="36" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="40" width="3" height="8" fill="var(--text-dim)" />
      <rect x="11" y="46" width="6" height="3" fill="var(--text-dim)" />
      {/* FRAME A — right knee drives toward chest */}
      <g className="anim-frame anim-frame-a">
        <rect x="50" y="38" width="3" height="8" fill="var(--text)" />
        <rect x="48" y="44" width="3" height="5" fill="var(--text)" />
        {/* other leg straight back */}
        <rect x="50" y="40" width="8" height="3" fill="var(--text)" />
        <rect x="56" y="43" width="3" height="6" fill="var(--text-dim)" />
      </g>
      {/* FRAME B — left leg drives, right extends */}
      <g className="anim-frame anim-frame-b">
        <rect x="50" y="40" width="8" height="3" fill="var(--text)" />
        <rect x="56" y="43" width="3" height="6" fill="var(--text-dim)" />
        <rect x="50" y="40" width="3" height="6" fill="var(--text)" />
        <rect x="46" y="46" width="4" height="3" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
