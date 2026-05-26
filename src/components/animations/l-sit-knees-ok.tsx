import { AnimationBase, type AnimationSize } from './AnimationBase';

export function LSitKneesOkAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-l-sit-knees-ok">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-pulse">
      <rect x="16" y="28" width="8" height="8" fill="var(--gold)" />
      <rect x="17" y="36" width="6" height="10" fill="var(--text)" />
      <rect x="14" y="44" width="3" height="8" fill="var(--text-dim)" />
      <rect x="11" y="48" width="6" height="3" fill="var(--text-dim)" />
      <rect x="23" y="46" width="3" height="8" fill="var(--text-dim)" />
      <rect x="20" y="50" width="6" height="3" fill="var(--text-dim)" />
      <rect x="23" y="42" width="14" height="4" fill="var(--text)" />
      <rect x="37" y="42" width="14" height="4" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
