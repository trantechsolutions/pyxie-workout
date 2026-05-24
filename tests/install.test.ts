import { describe, it, expect } from 'vitest';
import { isStandaloneDisplay, isIOSSafariUA, shouldShowFirstRunNudge } from '../src/lib/install';

describe('isStandaloneDisplay', () => {
  const mmTrue  = () => ({ matches: true })  as MediaQueryList;
  const mmFalse = () => ({ matches: false }) as MediaQueryList;
  it('returns true when display-mode standalone matches', () => {
    expect(isStandaloneDisplay(mmTrue, false)).toBe(true);
  });
  it('returns true for iOS navigator.standalone', () => {
    expect(isStandaloneDisplay(mmFalse, true)).toBe(true);
  });
  it('returns false when neither signal is present', () => {
    expect(isStandaloneDisplay(mmFalse, false)).toBe(false);
  });
  it('handles undefined inputs gracefully', () => {
    expect(isStandaloneDisplay(null, undefined)).toBe(false);
  });
});

describe('isIOSSafariUA', () => {
  const UA = {
    iPhoneSafari : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    iPadSafari   : 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    iPhoneChrome : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
    iPhoneFirefox: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/126.0 Mobile/15E148 Safari/604.1',
    androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
    desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  };
  it('detects iPhone Safari', () => { expect(isIOSSafariUA(UA.iPhoneSafari)).toBe(true); });
  it('detects iPad Safari',   () => { expect(isIOSSafariUA(UA.iPadSafari)).toBe(true); });
  it('rejects iPhone Chrome (CriOS)',  () => { expect(isIOSSafariUA(UA.iPhoneChrome)).toBe(false); });
  it('rejects iPhone Firefox (FxiOS)', () => { expect(isIOSSafariUA(UA.iPhoneFirefox)).toBe(false); });
  it('rejects Android Chrome', () => { expect(isIOSSafariUA(UA.androidChrome)).toBe(false); });
  it('rejects desktop Chrome', () => { expect(isIOSSafariUA(UA.desktopChrome)).toBe(false); });
  it('rejects desktop Safari (no iOS)', () => { expect(isIOSSafariUA(UA.desktopSafari)).toBe(false); });
});

describe('shouldShowFirstRunNudge', () => {
  it('fires exactly on 3rd workout', () => { expect(shouldShowFirstRunNudge(3, false, false)).toBe(true); });
  it('is gated below 3', () => { expect(shouldShowFirstRunNudge(2, false, false)).toBe(false); });
  it('is gated above 3 (one-time)', () => { expect(shouldShowFirstRunNudge(4, false, false)).toBe(false); });
  it('respects dismissal', () => { expect(shouldShowFirstRunNudge(3, true, false)).toBe(false); });
  it('skips when installed', () => { expect(shouldShowFirstRunNudge(3, false, true)).toBe(false); });
  it('returns false at 0', () => { expect(shouldShowFirstRunNudge(0, false, false)).toBe(false); });
});
