import { AnimationBase, type AnimationSize } from './AnimationBase';

export function PseudoPlanchePushUpAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-pseudo-planche-push-up">
  <rect x="4" y="50" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="8" y="28" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="32" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="32" width="4" height="4" fill="var(--text)" />
    <rect x="40" y="36" width="3" height="12" fill="var(--text-dim)" />
    <rect x="37" y="46" width="6" height="3" fill="var(--text-dim)" />
    <rect x="50" y="34" width="8" height="3" fill="var(--text)" />
    <rect x="56" y="37" width="3" height="12" fill="var(--text-dim)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="8" y="36" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="40" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="40" width="4" height="4" fill="var(--text)" />
    <rect x="40" y="44" width="3" height="4" fill="var(--text-dim)" />
    <rect x="37" y="46" width="6" height="3" fill="var(--text-dim)" />
    <rect x="50" y="42" width="8" height="3" fill="var(--text)" />
    <rect x="56" y="45" width="3" height="4" fill="var(--text-dim)" />
  </g>
    </AnimationBase>
  );
}
