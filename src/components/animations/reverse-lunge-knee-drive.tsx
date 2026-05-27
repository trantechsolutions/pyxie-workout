import { AnimationBase, type AnimationSize } from './AnimationBase';

export function ReverseLungeKneeDriveAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-reverse-lunge-knee-drive">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="22" y="10" width="8" height="8" fill="var(--gold)" />
    <rect x="23" y="18" width="6" height="12" fill="var(--text)" />
    <rect x="19" y="20" width="3" height="8" fill="var(--text-dim)" />
    <rect x="30" y="20" width="3" height="8" fill="var(--text-dim)" />
    <rect x="26" y="30" width="4" height="14" fill="var(--text)" />
    <rect x="26" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="36" y="30" width="4" height="14" fill="var(--text)" />
    <rect x="40" y="44" width="6" height="12" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="22" y="6" width="8" height="8" fill="var(--gold)" />
    <rect x="23" y="14" width="6" height="14" fill="var(--text)" />
    <rect x="19" y="16" width="3" height="10" fill="var(--text-dim)" />
    <rect x="30" y="16" width="3" height="10" fill="var(--text-dim)" />
    <rect x="26" y="28" width="4" height="28" fill="var(--text)" />
    <rect x="34" y="28" width="6" height="6" fill="var(--text)" />
    <rect x="34" y="34" width="4" height="8" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
