import { AnimationBase, type AnimationSize } from './AnimationBase';

export function SeatedLegExtensionsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-seated-leg-extensions">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <rect x="14" y="38" width="14" height="6" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="14" y="14" width="8" height="8" fill="var(--gold)" />
    <rect x="15" y="22" width="6" height="14" fill="var(--text)" />
    <rect x="11" y="24" width="3" height="10" fill="var(--text-dim)" />
    <rect x="22" y="24" width="3" height="10" fill="var(--text-dim)" />
    <rect x="16" y="36" width="4" height="8" fill="var(--text)" />
    <rect x="16" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="22" y="36" width="4" height="8" fill="var(--text)" />
    <rect x="22" y="44" width="4" height="12" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="14" y="14" width="8" height="8" fill="var(--gold)" />
    <rect x="15" y="22" width="6" height="14" fill="var(--text)" />
    <rect x="11" y="24" width="3" height="10" fill="var(--text-dim)" />
    <rect x="22" y="24" width="3" height="10" fill="var(--text-dim)" />
    <rect x="16" y="36" width="4" height="8" fill="var(--text)" />
    <rect x="16" y="44" width="4" height="12" fill="var(--text)" />
    <rect x="22" y="36" width="14" height="4" fill="var(--text)" />
    <rect x="36" y="36" width="14" height="4" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
