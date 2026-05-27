import { AnimationBase, type AnimationSize } from './AnimationBase';

export function ReverseSnowAngelsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-reverse-snow-angels">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="6" y="42" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="44" width="22" height="4" fill="var(--text)" />
    <rect x="34" y="44" width="4" height="4" fill="var(--text)" />
    <rect x="14" y="48" width="3" height="8" fill="var(--text-dim)" />
    <rect x="22" y="48" width="3" height="8" fill="var(--text-dim)" />
    <rect x="36" y="48" width="22" height="4" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="6" y="40" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="42" width="22" height="4" fill="var(--text)" />
    <rect x="34" y="42" width="4" height="4" fill="var(--text)" />
    <rect x="12" y="36" width="6" height="3" fill="var(--text-dim)" />
    <rect x="6" y="32" width="8" height="3" fill="var(--text-dim)" />
    <rect x="22" y="36" width="6" height="3" fill="var(--text-dim)" />
    <rect x="26" y="32" width="8" height="3" fill="var(--text-dim)" />
    <rect x="36" y="46" width="22" height="4" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
