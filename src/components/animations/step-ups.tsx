import { AnimationBase, type AnimationSize } from './AnimationBase';

export function StepUpsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-step-ups">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <rect x="40" y="44" width="18" height="14" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="22" y="12" width="8" height="8" fill="var(--gold)" />
    <rect x="23" y="20" width="6" height="14" fill="var(--text)" />
    <rect x="19" y="22" width="3" height="10" fill="var(--text-dim)" />
    <rect x="30" y="22" width="3" height="10" fill="var(--text-dim)" />
    <rect x="21" y="34" width="4" height="22" fill="var(--text)" />
    <rect x="27" y="34" width="4" height="10" fill="var(--text)" />
    <rect x="40" y="40" width="6" height="4" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="36" y="4" width="8" height="8" fill="var(--gold)" />
    <rect x="37" y="12" width="6" height="14" fill="var(--text)" />
    <rect x="33" y="14" width="3" height="10" fill="var(--text-dim)" />
    <rect x="44" y="14" width="3" height="10" fill="var(--text-dim)" />
    <rect x="40" y="26" width="4" height="18" fill="var(--text)" />
    <rect x="35" y="26" width="4" height="22" fill="var(--text)" />
    <rect x="33" y="48" width="6" height="3" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
