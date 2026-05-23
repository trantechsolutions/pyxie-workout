import { usePyxie } from '../store/usePyxie';

interface Props { onDismiss: () => void; }

export function InstallModal({ onDismiss }: Props) {
  const dismissInstallNudge = usePyxie((s) => s.dismissInstallNudge);
  const handleClick = () => { dismissInstallNudge(); onDismiss(); };
  return (
    <div className="install-modal">
      <div className="install-modal-card">
        <div className="install-modal-title">Keep Pyxie alive</div>
        <div className="install-modal-body">
          Add Pyxie to your home screen so your pet always lives one tap away.
          <div style={{ marginTop: 10 }}>Tap <b>Share</b> then <b>Add to Home Screen</b>.</div>
        </div>
        <button className="btn primary" onClick={handleClick}>Got it</button>
      </div>
    </div>
  );
}
