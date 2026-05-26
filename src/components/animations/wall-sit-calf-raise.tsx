import { AnimationBase, type AnimationSize } from './AnimationBase';

export function WallSitCalfRaiseAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-wall-sit-calf-raise">
    <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
    <rect x="4" y="6" width="2" height="54" fill="var(--border)" />
    <rect x="8" y="20" width="8" height="8" fill="var(--gold)" />
    <rect x="9" y="28" width="6" height="14" fill="var(--text)" />
    <rect x="15" y="38" width="16" height="4" fill="var(--text)" />
    <rect x="15" y="30" width="10" height="3" fill="var(--text-dim)" />
    <g className="anim-frame anim-frame-a">
      <rect x="29" y="42" width="4" height="14" fill="var(--text)" />
    </g>
    <g className="anim-frame anim-frame-b">
      <rect x="29" y="42" width="4" height="10" fill="var(--text)" />
      <rect x="29" y="52" width="4" height="2" fill="var(--text-dim)" />
    </g>
    </AnimationBase>
  );
}
