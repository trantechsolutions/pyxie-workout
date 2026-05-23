import { usePyxie } from '../store/usePyxie';
import { EggSprite } from '../components/EggSprite';
import { HATCH_WORKOUTS } from '../data/constants';

export function Hatch() {
  const starterName = usePyxie((s) => s.ui.starterName);
  const setStarterName = usePyxie((s) => s.setStarterName);
  const placeEgg = usePyxie((s) => s.placeEgg);

  const name = starterName ?? '';

  return (
    <>
      <div className="panel-title">A mysterious egg appears</div>
      <div className="panel-sub">You won't know what's inside until it hatches</div>
      <div className="starter-grid" style={{ justifyContent: 'center' }}>
        <div className="starter-card selected">
          <EggSprite size={120} />
          <div className="starter-name">???</div>
          <div className="starter-type">Hatches in {HATCH_WORKOUTS} workouts</div>
        </div>
      </div>
      <div className="hint">Complete {HATCH_WORKOUTS} workouts to incubate your egg. The creature inside is a surprise.</div>
      <div className="field">
        <div className="field-label">Name your egg</div>
        <input
          type="text"
          placeholder="Egg"
          value={name}
          maxLength={14}
          onChange={(e) => setStarterName(e.target.value)}
        />
      </div>
      <button className="btn primary" onClick={placeEgg}>Place egg in the nest</button>
    </>
  );
}
