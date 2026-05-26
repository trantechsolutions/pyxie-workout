import { EggSprite } from '../components/EggSprite';

// ADR-009 M2: shown while the server-pet fetch is in flight. Intentionally
// minimal — a pulsing egg in the existing aesthetic so the brief loading
// window feels deliberate, not blank. The `egg-pulse` keyframe applied to
// `.egg-sprite` in styles.css carries the motion.
export function PetLoading() {
  return (
    <div className="pet-loading">
      <div className="pet-stage-label">Waking your pyxie…</div>
      <div className="pet-display">
        <div className="pet-platform"></div>
        <EggSprite size={160} />
      </div>
      <div className="pet-mood">Loading…</div>
    </div>
  );
}
