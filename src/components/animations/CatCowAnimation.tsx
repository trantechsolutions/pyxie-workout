import { AnimationBase, type AnimationSize } from './AnimationBase';

/**
 * Cat-Cow: tabletop on hands and knees, spine flexes through two extremes.
 * Frame A (Cow) — back sags down, head lifts up.
 * Frame B (Cat) — back arches up, head tucks down.
 *
 * Limbs (arm column + knee column) stay planted; the spine + head are what move.
 */
export function CatCowAnimation({ size = 'md' }: { size?: AnimationSize }) {
  return (
    <AnimationBase size={size} className="anim-catcow">
      {/* ground line */}
      <rect x="4" y="50" width="56" height="2" fill="var(--border)" />

      {/* shared limbs — arm column (front) + knee column (back) */}
      <rect x="16" y="36" width="3" height="14" fill="var(--text-dim)" />
      <rect x="14" y="48" width="7" height="2" fill="var(--text-dim)" />
      <rect x="44" y="36" width="3" height="14" fill="var(--text-dim)" />
      <rect x="42" y="48" width="7" height="2" fill="var(--text-dim)" />

      {/* FRAME A — Cow: back sagged, head up */}
      <g className="anim-frame anim-frame-a">
        {/* head, lifted up and forward */}
        <rect x="6" y="22" width="6" height="6" fill="var(--gold)" />
        {/* neck angling up from shoulder to head */}
        <rect x="12" y="28" width="2" height="4" fill="var(--text)" />
        <rect x="14" y="30" width="2" height="4" fill="var(--text)" />
        {/* spine — sagged, dips low in middle */}
        <rect x="16" y="32" width="4" height="4" fill="var(--text)" />
        <rect x="20" y="34" width="6" height="3" fill="var(--text)" />
        <rect x="26" y="36" width="10" height="3" fill="var(--text)" />
        <rect x="36" y="34" width="6" height="3" fill="var(--text)" />
        <rect x="42" y="32" width="4" height="4" fill="var(--text)" />
        {/* tail nub, raised */}
        <rect x="46" y="30" width="3" height="3" fill="var(--gold)" />
      </g>

      {/* FRAME B — Cat: back arched, head tucked */}
      <g className="anim-frame anim-frame-b">
        {/* head, dropped between arms */}
        <rect x="10" y="38" width="6" height="6" fill="var(--gold)" />
        {/* neck curving down */}
        <rect x="14" y="34" width="2" height="4" fill="var(--text)" />
        <rect x="16" y="32" width="2" height="3" fill="var(--text)" />
        {/* spine — arched up, peaks in middle */}
        <rect x="16" y="30" width="4" height="4" fill="var(--text)" />
        <rect x="20" y="28" width="6" height="3" fill="var(--text)" />
        <rect x="26" y="26" width="10" height="3" fill="var(--text)" />
        <rect x="36" y="28" width="6" height="3" fill="var(--text)" />
        <rect x="42" y="30" width="4" height="4" fill="var(--text)" />
        {/* tail nub, tucked */}
        <rect x="46" y="33" width="3" height="3" fill="var(--gold)" />
      </g>
    </AnimationBase>
  );
}
