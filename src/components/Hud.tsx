import { usePyxie } from '../store/usePyxie';

export function Hud() {
  const pet = usePyxie((s) => s.pet);
  if (!pet || !pet.alive) return <div id="hud"></div>;

  const Stat = ({ label, val, cls }: { label: string; val: number; cls: string }) => (
    <div className={`stat ${cls} ${val < 25 ? 'stat-low' : ''}`}>
      <div className="stat-label"><span>{label}</span><span>{Math.round(val)}</span></div>
      <div className="stat-bar"><div className="stat-fill" style={{ width: `${val}%` }} /></div>
    </div>
  );

  return (
    <div id="hud">
      <div className="stats-bar">
        <Stat label="Hunger" val={pet.hunger} cls="hunger" />
        <Stat label="Happy" val={pet.happiness} cls="happy" />
        <Stat label="Energy" val={pet.energy} cls="energy" />
      </div>
    </div>
  );
}
