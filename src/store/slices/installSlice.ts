import type { BeforeInstallPromptEvent } from '../../lib/install';
import type { PyxieSlice } from './types';

export interface InstallSlice {
  installNudgeDismissed: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;

  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
  dismissInstallNudge: () => void;
}

export const createInstallSlice: PyxieSlice<InstallSlice> = (set) => ({
  installNudgeDismissed: false,
  deferredPrompt: null,

  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  dismissInstallNudge: () => set({ installNudgeDismissed: true, deferredPrompt: null }),
});
