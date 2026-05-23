import { usePyxie } from '../store/usePyxie';
import { Sprite } from '../components/Sprite';

export function Dead() {
  const pet = usePyxie((s) => s.pet)!;
  const resetPet = usePyxie((s) => s.resetPet);
  const days = Math.floor((Date.now() - pet.born) / (1000 * 60 * 60 * 24));
  return (
    <>
      <div className="panel-title" style={{ color: 'var(--red)' }}>{pet.name} has departed</div>
      <div className="panel-sub">Your companion needed more care</div>
      <div className="pet-display" style={{ opacity: 0.4, filter: 'grayscale(0.8)' }}>
        <Sprite line={pet.line} stage={pet.stage} size={180} />
      </div>
      <div className="hint">{pet.name} reached stage {pet.stage + 1} of 5 over {days} days, with {pet.xp} total XP earned.</div>
      <button className="btn primary" onClick={resetPet}>Begin again</button>
    </>
  );
}
