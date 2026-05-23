import { usePyxie } from '../../store/usePyxie';

export function SoundSection() {
  const soundOn = usePyxie((s) => s.settings.soundOn);
  const toggleSound = usePyxie((s) => s.toggleSound);

  return (
    <div className="row">
      <div>
        <div className="row-label">Sound effects</div>
        <div className="row-sub">Beeps during workout</div>
      </div>
      <div className={`toggle ${soundOn ? 'on' : ''}`} onClick={toggleSound}></div>
    </div>
  );
}
