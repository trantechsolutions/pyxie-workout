import { useEffect, useMemo, useRef, useState } from 'react';
import { useFamilyConstellation } from '../hooks/useFamilyConstellation';
import { useReturningCelebration } from '../hooks/useReturningCelebration';
import { Sprite } from '../components/Sprite';
import { EggSprite } from '../components/EggSprite';
import { spriteFromSnapshot } from '../lib/spriteFromSnapshot';
import { beep } from '../lib/audio';
import { usePyxie } from '../store/usePyxie';
import type { ConstellationMember, ConstellationStatus } from '../lib/familyTypes';

// ADR-0007: tone is encouraging — never penalising. Inactive members drift
// outward or curl up asleep; brightness is constant. The status copy uses
// "active / resting / asleep" — explicitly NOT "inactive", "lapsed",
// "fallen behind", or any synonym of absence.

// Constellation geometry — ported from constellation.pen. Members are placed
// at equal angular intervals on a single elliptical orbit. Status is
// communicated by the pill below each pyxie, not by position; every member
// gets the same purple "pyxie aura" visual.
const PANE_W = 320;
const PANE_H = 280;
const CENTER_X = PANE_W / 2;
const CENTER_Y = PANE_H / 2;
const ELLIPSE_RX = 120;
const ELLIPSE_RY = 78;
const SLOT_BOX = 60;      // outer rounded-square that contains the sprite
const SPRITE_SIZE = 44;   // pixel-art sprite fitted inside the box
// Slot ring (76px) and halo (96px) sizes live in CSS only — they're purely
// decorative chrome, scaled relative to the slot box.

const STATUS_COPY: Record<ConstellationStatus, string> = {
  active: 'active',
  drifting: 'resting',
  sleeping: 'asleep',
};

// Deterministic starfield — fixed seed so positions don't shuffle between
// renders. Roughly matches the density and size variation in the .pen design.
interface Star { x: number; y: number; r: number; o: number }
const STARS: Star[] = (() => {
  let s = 7;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: 28 }, () => ({
    x: Math.round(r() * PANE_W),
    y: Math.round(r() * PANE_H),
    r: r() > 0.65 ? 1.2 : 0.7,
    o: 0.35 + r() * 0.3,
  }));
})();

interface LaidOutMember {
  member: ConstellationMember;
  x: number;
  y: number;
}

function layOutMembers(members: ConstellationMember[]): LaidOutMember[] {
  if (members.length === 0) return [];
  // Equal angular spacing on the ellipse, caller (members[0]) at 12 o'clock.
  // Spot count == member count — no placeholders for empty seats.
  const step = (Math.PI * 2) / members.length;
  return members.map((m, i) => {
    const angle = -Math.PI / 2 + step * i;
    return {
      member: m,
      x: CENTER_X + Math.cos(angle) * ELLIPSE_RX - SLOT_BOX / 2,
      y: CENTER_Y + Math.sin(angle) * ELLIPSE_RY - SLOT_BOX / 2,
    };
  });
}

function MemberSlot({
  member,
  celebrating,
  tiltDeg,
}: {
  member: ConstellationMember;
  celebrating: boolean;
  tiltDeg: number;
}) {
  // Visual chrome ported from constellation.pen: blurred purple halo,
  // bright purple ring, dark rounded-square box with the sprite inside.
  // Status differentiation lives below in the pill — the slot chrome is
  // consistent across statuses (the "pyxie aura" the design implies).
  const slotCls =
    `family-slot family-slot--${member.status}` +
    (celebrating ? ' family-slot--celebrating' : '') +
    (tiltDeg !== 0 ? ' family-slot--tilted' : '');
  const tiltStyle = tiltDeg !== 0 && !celebrating
    ? { transform: `rotate(${tiltDeg.toFixed(2)}deg)` }
    : undefined;

  // Egg only when the member's pyxie genuinely is an egg (snapshot carries
  // an empty lineage_id, matching petSlice convention) — or when no snapshot
  // exists yet (transient: useSyncPetSnapshot will push one shortly).
  const isEgg = !member.sprite || member.sprite.lineage_id === '';
  const inner = isEgg
    ? <EggSprite size={SPRITE_SIZE} />
    : <Sprite {...spriteFromSnapshot(member.sprite!)} size={SPRITE_SIZE} />;

  return (
    <div className={slotCls} style={tiltStyle}>
      <div className="family-slot-halo" aria-hidden="true" />
      <div className="family-slot-ring" aria-hidden="true" />
      <div className="family-slot-box">
        {inner}
      </div>
      {celebrating && (
        <div className="family-celebration-sparkles" aria-hidden="true">
          <span className="family-sparkle" /><span className="family-sparkle" />
          <span className="family-sparkle" /><span className="family-sparkle" />
          <span className="family-sparkle" />
        </div>
      )}
      {!celebrating && member.status === 'active' && (
        <div className="family-sparkles" aria-hidden="true">
          <span className="family-sparkle" /><span className="family-sparkle" /><span className="family-sparkle" />
        </div>
      )}
      {member.status === 'sleeping' && !celebrating && (
        <div className="family-sleep-z" aria-hidden="true">z</div>
      )}
    </div>
  );
}

export function Family() {
  const { data, loading, error, refetch } = useFamilyConstellation();
  const { celebrating } = useReturningCelebration(data);
  const soundOn = usePyxie((s) => s.settings.soundOn);
  const [showInvite, setShowInvite] = useState(false);
  // Milestone 6: fire a single gentle audio cue per celebration. Tracks
  // which celebrants we've already chimed for so a re-render mid-window
  // doesn't double-beep.
  const chimedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (celebrating.length === 0) {
      chimedRef.current.clear();
      return;
    }
    for (const userId of celebrating) {
      if (chimedRef.current.has(userId)) continue;
      chimedRef.current.add(userId);
      beep('evolution', soundOn);
    }
  }, [celebrating, soundOn]);

  // ADR-0007 Milestone 6: when X is celebrating, other members tilt ~10°
  // toward X's angle in the constellation. Hook must run unconditionally —
  // declared above the loading/error early returns to keep hook order stable.
  const tilts = useMemo<Record<string, number>>(() => {
    const members = data?.members ?? [];
    if (celebrating.length === 0 || members.length === 0) return {};
    const step = (Math.PI * 2) / members.length;
    const angleOf = (idx: number) => -Math.PI / 2 + step * idx;
    const focusIdx = members.findIndex((m) => m.user_id === celebrating[0]);
    if (focusIdx === -1) return {};
    const focusAngle = angleOf(focusIdx);
    const out: Record<string, number> = {};
    members.forEach((m, i) => {
      if (m.user_id === celebrating[0]) return;
      const delta = focusAngle - angleOf(i);
      const signed = Math.atan2(Math.sin(delta), Math.cos(delta));
      const degrees = signed * (180 / Math.PI);
      out[m.user_id] = Math.max(-10, Math.min(10, degrees / 18));
    });
    return out;
  }, [celebrating, data]);

  if (loading && !data) {
    return (
      <>
        <div className="panel-title">Family</div>
        <div className="panel-sub">Loading the constellation…</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="panel-title">Family</div>
        <div className="row-sub" style={{ padding: 12 }}>
          Could not load the constellation. <button className="btn" onClick={() => { void refetch(); }}>Retry</button>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="panel-title">Family</div>
        <div className="panel-sub">No family yet — head to Settings to create one.</div>
      </>
    );
  }

  const members = data.members;
  const placed = layOutMembers(members);
  const isSolo = members.length <= 1;
  const anyActive = members.some((m) => m.status === 'active');

  return (
    <>
      <div className="family-header">
        <div>
          <div className="panel-title">{data.family.name}</div>
          <div className="panel-sub">{members.length} pyxie{members.length === 1 ? '' : 's'} in your sky</div>
        </div>
        <button className="btn cyan" onClick={() => setShowInvite((v) => !v)}>
          Invite
        </button>
      </div>
      {showInvite && (
        <div className="family-invite-pop">
          Share this code: <b>{data.family.invite_code}</b>
        </div>
      )}

      <div
        className="family-constellation"
        style={{ width: PANE_W, height: PANE_H, position: 'relative' }}
      >
        {/* Background: starfield + orbit ring, drawn in one SVG so the
            stars stay perfectly aligned with the ellipse. */}
        <svg
          className="family-constellation-bg"
          width={PANE_W}
          height={PANE_H}
          viewBox={`0 0 ${PANE_W} ${PANE_H}`}
          aria-hidden="true"
        >
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={s.o} />
          ))}
          <ellipse
            cx={CENTER_X}
            cy={CENTER_Y}
            rx={ELLIPSE_RX}
            ry={ELLIPSE_RY}
            fill="none"
            stroke="#4A6ABA"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        </svg>
        {placed.map(({ member, x, y }) => (
          <div
            key={member.user_id}
            className="family-pyxie-wrap"
            style={{ position: 'absolute', left: x, top: y }}
          >
            <MemberSlot
              member={member}
              celebrating={celebrating.includes(member.user_id)}
              tiltDeg={tilts[member.user_id] ?? 0}
            />
            <div className="family-label">
              <div className="family-name">{member.display_name}</div>
              <div className={`family-status-pill family-status-pill--${member.status}`}>
                {STATUS_COPY[member.status]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isSolo && (
        <div className="family-empty">
          Your constellation grows when family joins. Share your invite code: <b>{data.family.invite_code}</b>
        </div>
      )}
      {!isSolo && !anyActive && (
        <div className="family-quiet">
          A quiet day. Whoever moves next gets a little parade.
        </div>
      )}
    </>
  );
}
