// Pure helpers (testable without DOM).
export function isStandaloneDisplay(
  matchMedia: ((q: string) => MediaQueryList) | null,
  navigatorStandalone: boolean | undefined,
): boolean {
  const mm = !!(matchMedia && matchMedia('(display-mode: standalone)').matches);
  return mm || navigatorStandalone === true;
}

export function isIOSSafariUA(ua: string): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export function shouldShowFirstRunNudge(historyLength: number, dismissed: boolean, isInstalled: boolean): boolean {
  return historyLength === 3 && !dismissed && !isInstalled;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function isInstalledNow(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return isStandaloneDisplay(window.matchMedia.bind(window), nav.standalone);
}
