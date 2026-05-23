import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import type { BeforeInstallPromptEvent } from '../lib/install';

export function useInstallPromptCapture(): void {
  const setDeferredPrompt = usePyxie((s) => s.setDeferredPrompt);
  const dismissInstallNudge = usePyxie((s) => s.dismissInstallNudge);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      dismissInstallNudge();
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [setDeferredPrompt, dismissInstallNudge]);
}
