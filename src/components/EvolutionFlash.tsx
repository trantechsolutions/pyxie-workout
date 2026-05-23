import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import { Sprite } from './Sprite';
import { getNode, legacyLineageId } from '../data/evolutionTree';
import { beep } from '../lib/audio';

export function EvolutionFlash() {
  const evolved = usePyxie((s) => s.evolved);
  const acknowledge = usePyxie((s) => s.acknowledgeEvolution);
  const soundOn = usePyxie((s) => s.settings.soundOn);

  useEffect(() => {
    if (!evolved) return;
    beep('evolution', soundOn);
    const timer = setTimeout(acknowledge, 3000);
    return () => clearTimeout(timer);
  }, [evolved, soundOn, acknowledge]);

  if (!evolved) return null;
  const pet = evolved.pet;
  const node = getNode(pet.lineageId) ?? getNode(legacyLineageId(pet.line, pet.stage));
  const newName = node?.name ?? pet.name;
  return (
    <div className="evo-flash" onClick={acknowledge} style={{ cursor: 'pointer' }}>
      <Sprite line={pet.line} stage={pet.stage} lineageId={pet.lineageId} seed={pet.born} size={220} />
      <div className="evo-text">{pet.name} evolved!</div>
      <div style={{ color: '#fff', fontFamily: "'Pixelify Sans', sans-serif", fontSize: '0.95rem', marginTop: 6, letterSpacing: '0.15em' }}>
        → {newName.toUpperCase()}
      </div>
    </div>
  );
}
