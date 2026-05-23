import { useEffect, useState } from 'react';
import { usePyxie } from '../store/usePyxie';
import { isIOSSafariUA, isInstalledNow, shouldShowFirstRunNudge } from '../lib/install';

export function useIosInstallNudge(): { show: boolean; dismiss: () => void } {
  const historyLength = usePyxie((s) => s.history.length);
  const installNudgeDismissed = usePyxie((s) => s.installNudgeDismissed);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (
      shouldShowFirstRunNudge(historyLength, installNudgeDismissed, isInstalledNow()) &&
      isIOSSafariUA(navigator.userAgent)
    ) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, [historyLength, installNudgeDismissed]);

  return { show, dismiss: () => setShow(false) };
}
