import { usePyxie, selectXpToNext, selectIsFinalForm } from '../store/usePyxie';
import { LINE_INFO } from '../data/lineRegistry';
import { EVOLUTION_TREE, legacyLineageId } from '../data/evolutionTree';
import { Sprite } from '../components/Sprite';
import { EggSprite } from '../components/EggSprite';
import { petMood } from '../lib/decay';
import { streakMultiplier } from '../lib/progression';
import { Hatch } from './Hatch';
import { PetLoading } from './PetLoading';

export function Pet() {
  const pet = usePyxie((s) => s.pet);
  const petHydrating = usePyxie((s) => s.petHydrating);
  const tapPet = usePyxie((s) => s.tapPet);
  const play = usePyxie((s) => s.play);
  const setTab = usePyxie((s) => s.setTab);

  // ADR-009 M2: loading state takes priority over the Hatch fallback so users
  // with a server-side pet don't see a flash of the egg-nest screen.
  if (petHydrating) return <PetLoading />;
  if (!pet) return <Hatch />;

  if (pet.workoutsToHatch > 0) {
    return (
      <>
        <div className="pet-stage-label">Egg · incubating</div>
        <div className="pet-name">{pet.name}</div>
        <div className="pet-display">
          <div className="pet-platform"></div>
          <EggSprite size={200} />
        </div>
        <div className="pet-mood">A faint warmth pulses from within…</div>
        <div className="meta-line">
          <span>Hatches in <b>{pet.workoutsToHatch} workout{pet.workoutsToHatch === 1 ? '' : 's'}</b></span>
        </div>
        <div className="pet-actions pet-actions--single">
          <button className="btn primary" onClick={() => setTab('workout')}>Workout</button>
        </div>
      </>
    );
  }

  const lineInfo = LINE_INFO[pet.line];
  const xpToNext = selectXpToNext(pet);
  const isFinal = selectIsFinalForm(pet);
  // Next workout will earn at least this multiplier (assumes continued streak).
  const nextMult = streakMultiplier(Math.max(1, pet.streak + 1));
  const showBonus = nextMult > 1;
  const effectiveLineageId = pet.lineageId || legacyLineageId(pet.line, pet.stage);
  const lineageNode = EVOLUTION_TREE[effectiveLineageId];
  const lineageName = lineageNode?.name ?? lineInfo.label;

  return (
    <>
      <div className="pet-stage-label">Stage {pet.stage + 1} of 5 · {lineageName}</div>
      <div className="pet-name">{pet.name}</div>
      <div className="pet-display">
        <div className="pet-platform"></div>
        <Sprite line={pet.line} stage={pet.stage} size={200} onClick={tapPet} lineageId={effectiveLineageId} seed={pet.born} />
      </div>
      <div className="pet-mood">{petMood(pet)}</div>
      <div className="meta-line">
        <span>
          Streak <b>{pet.streak}d</b>
          {showBonus && <span className="xp-bonus-chip" title="Next-workout XP bonus">{nextMult.toFixed(2)}×</span>}
        </span>
        <span>XP <b>{pet.xp}</b></span>
        {isFinal ? <span><b>Final form</b></span> : <span>Next <b>{xpToNext} XP</b></span>}
      </div>
      <div className="pet-actions">
        <button className="btn cyan" onClick={play}>Play</button>
        <button className="btn primary" onClick={() => setTab('workout')}>Workout</button>
      </div>
    </>
  );
}
