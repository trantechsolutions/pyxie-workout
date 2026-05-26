import { AnimationBase, type AnimationSize } from './AnimationBase';

export function PlankToPushUpAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-plank-to-push-up">
    <rect x="4" y="50" width="56" height="2" fill="var(--border)" />
    <g className="anim-burpee-frame anim-burpee-1">
      <rect x="8" y="36" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="40" width="32" height="4" fill="var(--text)" />
      <rect x="46" y="40" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="44" width="14" height="4" fill="var(--text-dim)" />
      <rect x="50" y="42" width="8" height="3" fill="var(--text)" />
      <rect x="56" y="45" width="3" height="5" fill="var(--text-dim)" />
    </g>
    <g className="anim-burpee-frame anim-burpee-2">
      <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="36" width="32" height="4" fill="var(--text)" />
      <rect x="46" y="36" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="40" width="3" height="8" fill="var(--text-dim)" />
      <rect x="11" y="46" width="6" height="3" fill="var(--text-dim)" />
      <rect x="22" y="44" width="6" height="4" fill="var(--text-dim)" />
      <rect x="50" y="38" width="8" height="3" fill="var(--text)" />
      <rect x="56" y="41" width="3" height="8" fill="var(--text-dim)" />
    </g>
    <g className="anim-burpee-frame anim-burpee-3">
      <rect x="8" y="32" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="36" width="32" height="4" fill="var(--text)" />
      <rect x="46" y="36" width="4" height="4" fill="var(--text)" />
      <rect x="14" y="40" width="3" height="8" fill="var(--text-dim)" />
      <rect x="22" y="40" width="3" height="8" fill="var(--text-dim)" />
      <rect x="50" y="38" width="8" height="3" fill="var(--text)" />
      <rect x="56" y="41" width="3" height="8" fill="var(--text-dim)" />
    </g>
    <g className="anim-burpee-frame anim-burpee-4">
      <rect x="8" y="36" width="6" height="6" fill="var(--gold)" />
      <rect x="14" y="40" width="32" height="4" fill="var(--text)" />
      <rect x="46" y="40" width="4" height="4" fill="var(--text)" />
      <rect x="22" y="44" width="14" height="4" fill="var(--text-dim)" />
      <rect x="50" y="42" width="8" height="3" fill="var(--text)" />
      <rect x="56" y="45" width="3" height="5" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
