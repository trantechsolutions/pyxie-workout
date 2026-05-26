import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Jumping jack: arms/legs in and out. */
export function JumpAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-jump">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* FRAME A — closed (feet together, arms down) */}
      <g className="anim-frame anim-frame-a">
        <rect x="28" y="10" width="8" height="8" fill="var(--gold)" />
        <rect x="29" y="18" width="6" height="14" fill="var(--text)" />
        {/* arms down */}
        <rect x="25" y="20" width="3" height="12" fill="var(--text-dim)" />
        <rect x="36" y="20" width="3" height="12" fill="var(--text-dim)" />
        {/* legs together */}
        <rect x="28" y="32" width="3" height="24" fill="var(--text)" />
        <rect x="33" y="32" width="3" height="24" fill="var(--text)" />
      </g>
      {/* FRAME B — open (arms up, legs spread) */}
      <g className="anim-frame anim-frame-b">
        <rect x="28" y="14" width="8" height="8" fill="var(--gold)" />
        <rect x="29" y="22" width="6" height="12" fill="var(--text)" />
        {/* arms up & out */}
        <rect x="20" y="14" width="8" height="3" fill="var(--text-dim)" />
        <rect x="18" y="10" width="3" height="8" fill="var(--text-dim)" />
        <rect x="36" y="14" width="8" height="3" fill="var(--text-dim)" />
        <rect x="43" y="10" width="3" height="8" fill="var(--text-dim)" />
        {/* legs spread */}
        <rect x="20" y="34" width="3" height="6" fill="var(--text)" />
        <rect x="17" y="40" width="3" height="16" fill="var(--text)" />
        <rect x="41" y="34" width="3" height="6" fill="var(--text)" />
        <rect x="44" y="40" width="3" height="16" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
