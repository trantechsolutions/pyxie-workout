import { AnimationBase, type AnimationSize } from './AnimationBase';

export function ReverseCrunchesAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-reverse-crunches">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="6" y="50" width="6" height="6" fill="var(--gold)" />
      <rect x="12" y="52" width="22" height="4" fill="var(--text)" />
      <rect x="34" y="48" width="4" height="8" fill="var(--text)" />
      <rect x="38" y="44" width="4" height="4" fill="var(--text)" />
      <rect x="42" y="44" width="4" height="12" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="6" y="50" width="6" height="6" fill="var(--gold)" />
      <rect x="12" y="52" width="22" height="4" fill="var(--text)" />
      <rect x="20" y="44" width="4" height="8" fill="var(--text)" />
      <rect x="24" y="40" width="6" height="4" fill="var(--text)" />
      <rect x="30" y="44" width="4" height="8" fill="var(--text)" />
    </g>
    </AnimationBase>
  );
}
