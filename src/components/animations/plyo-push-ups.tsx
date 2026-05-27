import { AnimationBase, type AnimationSize } from './AnimationBase';

export function PlyoPushUpsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-plyo-push-ups">
  <rect x="4" y="50" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="8" y="38" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="42" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="42" width="4" height="4" fill="var(--text)" />
    <rect x="14" y="46" width="6" height="3" fill="var(--text-dim)" />
    <rect x="50" y="44" width="8" height="3" fill="var(--text)" />
    <rect x="56" y="47" width="3" height="3" fill="var(--text-dim)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="8" y="26" width="6" height="6" fill="var(--gold)" />
    <rect x="14" y="30" width="32" height="4" fill="var(--text)" />
    <rect x="46" y="30" width="4" height="4" fill="var(--text)" />
    <rect x="14" y="34" width="3" height="10" fill="var(--text-dim)" />
    <rect x="50" y="32" width="8" height="3" fill="var(--text)" />
    <rect x="56" y="35" width="3" height="10" fill="var(--text-dim)" />
    <rect x="10" y="46" width="4" height="2" fill="var(--gold)" />
    <rect x="50" y="46" width="4" height="2" fill="var(--gold)" />
  </g>
    </AnimationBase>
  );
}
