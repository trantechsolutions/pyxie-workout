import { AnimationBase, type AnimationSize } from './AnimationBase';

export function DeadBugAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-dead-bug">
  <rect x="4" y="58" width="56" height="2" fill="var(--border)" />
  <g className="anim-frame anim-frame-a">
    <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="50" width="22" height="4" fill="var(--text)" />
    <rect x="14" y="40" width="3" height="10" fill="var(--text-dim)" />
    <rect x="22" y="40" width="3" height="10" fill="var(--text-dim)" />
    <rect x="34" y="42" width="4" height="8" fill="var(--text)" />
    <rect x="38" y="38" width="4" height="4" fill="var(--text)" />
    <rect x="34" y="50" width="4" height="6" fill="var(--text)" />
  </g>
  <g className="anim-frame anim-frame-b">
    <rect x="6" y="48" width="6" height="6" fill="var(--gold)" />
    <rect x="12" y="50" width="22" height="4" fill="var(--text)" />
    <rect x="14" y="46" width="3" height="4" fill="var(--text-dim)" />
    <rect x="6" y="36" width="3" height="12" fill="var(--text-dim)" />
    <rect x="22" y="40" width="3" height="10" fill="var(--text-dim)" />
    <rect x="34" y="42" width="4" height="8" fill="var(--text)" />
    <rect x="38" y="38" width="4" height="4" fill="var(--text)" />
    <rect x="42" y="36" width="4" height="14" fill="var(--text)" />
    <rect x="34" y="50" width="4" height="6" fill="var(--text)" />
  </g>
    </AnimationBase>
  );
}
