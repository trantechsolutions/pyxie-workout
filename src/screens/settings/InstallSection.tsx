import { usePyxie } from '../../store/usePyxie';
import { isInstalledNow } from '../../lib/install';

export function InstallSection() {
  const deferredPrompt = usePyxie((s) => s.deferredPrompt);
  const setDeferredPrompt = usePyxie((s) => s.setDeferredPrompt);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch { /* ignore */ }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isInstalledNow()) return null;

  return (
    <div className="install-row">
      <button className="btn cyan" style={{ width: '100%' }} onClick={handleInstall}>Install App</button>
      <div className="row-sub" style={{ textAlign: 'center', marginTop: 6 }}>Pin Pyxie to your home screen for the full experience.</div>
    </div>
  );
}
