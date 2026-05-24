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

const PANE_SIZE = 320;
const CENTER = PANE_SIZE / 2;
const SPRITE_SIZE = 56;

const RADIUS_BY_STATUS: Record<ConstellationStatus, number> = {
  active: PANE_SIZE * 0.30,
  drifting: PANE_SIZE * 0.55 / 2,
  sleeping: PANE_SIZE * 0.75 / 2,
};

const STATUS_COPY: Record<ConstellationStatus, string> = {
  active: 'active',
  drifting: 'resting',
  sleeping: 'asleep',
};

interface LaidOutMember {
  member: ConstellationMember;
  x: number;
  y: number;
}

function layOutMembers(members: ConstellationMember[]): LaidOutMember[] {
  if (members.length === 0) return [];
  // Equal angular spacing, caller (members[0]) at 12 o'clock.
  const step = (Math.PI * 2) / members.length;
  return members.map((m, i) => {
    const angle = -Math.PI / 2 + step * i;
    const radius = RADIUS_BY_STATUS[m.status];
    return {
      member: m,
      x: CENTER + Math.cos(angle) * radius - SPRITE_SIZE / 2,
      y: CENTER + Math.sin(angle) * radius - SPRITE_SIZE / 2,
    };
  });
}

function MemberPyxie({
  member,
  celebrating,
  tiltDeg,
}: {
  member: ConstellationMember;
  celebrating: boolean;
  tiltDeg: number;
}) {
  // ADR-0007 Milestone 6: when this pyxie is the celebrant, layer the "wake
  // up" animation. When another pyxie is celebrating, this one subtly tilts
  // toward them for the duration.
  const cls =
    `family-pyxie family-pyxie--${member.status}` +
    (celebrating ? ' family-pyxie--celebrating' : '') +
    (tiltDeg !== 0 ? ' family-pyxie--tilted' : '');
  const tiltStyle = tiltDeg !== 0 && !celebrating
    ? { transform: `rotate(${tiltDeg.toFixed(2)}deg)` }
    : undefined;
  if (!member.sprite) {
    return (
      <div className={cls} style={tiltStyle}>
        <EggSprite size={SPRITE_SIZE} />
      </div>
    );
  }
  const props = spriteFromSnapshot(member.sprite);
  return (
    <div className={cls} style={tiltStyle}>
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
      <Sprite
        line={props.line}
        stage={props.stage}
        size={SPRITE_SIZE}
        lineageId={props.lineageId}
        seed={props.seed}
      />
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
        style={{ width: PANE_SIZE, height: PANE_SIZE, position: 'relative' }}
      >
        <div
          className="family-campfire"
          style={{ left: CENTER - 12, top: CENTER - 12 }}
          aria-hidden="true"
        />
        {placed.map(({ member, x, y }) => (
          <div
            key={member.user_id}
            className="family-pyxie-wrap"
            style={{ position: 'absolute', left: x, top: y }}
          >
            <MemberPyxie
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
