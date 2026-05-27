import { AnimationBase, type AnimationSize } from './AnimationBase';

export function GluteBridgeMarchAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-glute-bridge-march">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="50" width="20" height="4" fill="var(--text)" />
    <rect x="32" y="50" width="4" height="4" fill="var(--text)" />
    <rect x="36" y="44" width="6" height="4" fill="var(--text)" />
    <rect x="40" y="48" width="4" height="8" fill="var(--text)" />
    
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="46" width="6" height="4" fill="var(--text)" />
    <rect x="18" y="42" width="6" height="4" fill="var(--text)" />
    <rect x="24" y="38" width="6" height="4" fill="var(--text)" />
    <rect x="30" y="36" width="6" height="4" fill="var(--text)" />
    <rect x="36" y="40" width="6" height="4" fill="var(--text)" />
    <rect x="40" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="46" y="14" width="4" height="28" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
