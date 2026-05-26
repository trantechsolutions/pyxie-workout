import { AnimationBase, type AnimationSize } from './AnimationBase';

export function RussianTwistsAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-russian-twists">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <g className="anim-frame anim-frame-a">
      <rect x="20" y="14" width="8" height="8" fill="var(--gold)" />
      <rect x="22" y="22" width="8" height="4" fill="var(--text)" />
      <rect x="26" y="26" width="6" height="6" fill="var(--text)" />
      <rect x="30" y="32" width="4" height="10" fill="var(--text)" />
      <rect x="34" y="42" width="14" height="4" fill="var(--text)" />
      <rect x="42" y="36" width="6" height="3" fill="var(--text-dim)" />
      <rect x="14" y="36" width="6" height="3" fill="var(--text-dim)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="36" y="14" width="8" height="8" fill="var(--gold)" />
      <rect x="34" y="22" width="8" height="4" fill="var(--text)" />
      <rect x="32" y="26" width="6" height="6" fill="var(--text)" />
      <rect x="30" y="32" width="4" height="10" fill="var(--text)" />
      <rect x="34" y="42" width="14" height="4" fill="var(--text)" />
      <rect x="44" y="36" width="6" height="3" fill="var(--text-dim)" />
      <rect x="16" y="36" width="6" height="3" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
