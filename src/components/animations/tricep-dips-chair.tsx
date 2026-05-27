import { AnimationBase, type AnimationSize } from './AnimationBase';

export function TricepDipsChairAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-tricep-dips-chair">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <rect x="6" y="32" width="16" height="20" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="20" y="14" width="8" height="8" fill="var(--gold)" />
    <rect x="21" y="22" width="6" height="14" fill="var(--text)" />
    <rect x="22" y="36" width="14" height="4" fill="var(--text)" />
    <rect x="14" y="32" width="3" height="6" fill="var(--text-dim)" />
    <rect x="36" y="40" width="4" height="8" fill="var(--text)" />
    <rect x="40" y="48" width="14" height="4" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="20" y="20" width="8" height="8" fill="var(--gold)" />
    <rect x="21" y="28" width="6" height="12" fill="var(--text)" />
    <rect x="22" y="40" width="14" height="4" fill="var(--text)" />
    <rect x="14" y="32" width="3" height="6" fill="var(--text-dim)" />
    <rect x="14" y="38" width="3" height="6" fill="var(--text-dim)" />
    <rect x="36" y="44" width="4" height="4" fill="var(--text)" />
    <rect x="40" y="48" width="14" height="4" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
