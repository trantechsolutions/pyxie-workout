import { AnimationBase, type AnimationSize } from './AnimationBase';

/** Lunge: alternating forward-leg lunge poses. */
export function LungeAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-lunge">
      <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
      {/* FRAME A — right leg forward */}
      <g className="anim-frame anim-frame-a">
        <rect x="22" y="10" width="8" height="8" fill="var(--gold)" />
        <rect x="23" y="18" width="6" height="12" fill="var(--text)" />
        <rect x="19" y="20" width="3" height="8" fill="var(--text-dim)" />
        <rect x="30" y="20" width="3" height="8" fill="var(--text-dim)" />
        {/* front leg (right) bent */}
        <rect x="26" y="30" width="4" height="12" fill="var(--text)" />
        <rect x="34" y="42" width="4" height="14" fill="var(--text)" />
        <rect x="30" y="42" width="4" height="3" fill="var(--text)" />
        {/* back leg (left) bent down */}
        <rect x="18" y="30" width="4" height="14" fill="var(--text)" />
        <rect x="14" y="44" width="4" height="12" fill="var(--text)" />
      </g>
      {/* FRAME B — left leg forward (mirror) */}
      <g className="anim-frame anim-frame-b">
        <rect x="34" y="10" width="8" height="8" fill="var(--gold)" />
        <rect x="35" y="18" width="6" height="12" fill="var(--text)" />
        <rect x="31" y="20" width="3" height="8" fill="var(--text-dim)" />
        <rect x="42" y="20" width="3" height="8" fill="var(--text-dim)" />
        <rect x="34" y="30" width="4" height="12" fill="var(--text)" />
        <rect x="26" y="42" width="4" height="14" fill="var(--text)" />
        <rect x="30" y="42" width="4" height="3" fill="var(--text)" />
        <rect x="42" y="30" width="4" height="14" fill="var(--text)" />
        <rect x="46" y="44" width="4" height="12" fill="var(--text)" />
      </g>
    </AnimationBase>
  );
}
