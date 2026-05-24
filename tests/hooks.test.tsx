import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyAlarm } from '../src/hooks/useDailyAlarm';
import { useDecayLoop } from '../src/hooks/useDecayLoop';
import { useInstallPromptCapture } from '../src/hooks/useInstallPromptCapture';
import { useIosInstallNudge } from '../src/hooks/useIosInstallNudge';
import { usePersistenceLifecycle } from '../src/hooks/usePersistenceLifecycle';
import { usePyxie } from '../src/store/usePyxie';
import { resetStore, makePet, makeHistory } from './helpers';

beforeEach(() => {
  resetStore();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useDecayLoop', () => {
  it('calls decayTick immediately on mount', () => {
    usePyxie.setState({ pet: makePet({ hunger: 50, lastDecay: Date.now() - 10 * 60_000 }) });
    const spy = vi.spyOn(usePyxie.getState(), 'decayTick');
    renderHook(() => useDecayLoop());
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('calls decayTick on each 60s interval', () => {
    const spy = vi.spyOn(usePyxie.getState(), 'decayTick');
    renderHook(() => useDecayLoop());
    spy.mockClear();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(spy).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(60_000 * 3); });
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('clears the interval on unmount', () => {
    const spy = vi.spyOn(usePyxie.getState(), 'decayTick');
    const { unmount } = renderHook(() => useDecayLoop());
    spy.mockClear();
    unmount();
    act(() => { vi.advanceTimersByTime(60_000 * 5); });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useDailyAlarm', () => {
  it('fires when the wall clock matches and the day has not yet fired', () => {
    const target = new Date();
    target.setSeconds(0, 0);
    vi.setSystemTime(target);
    usePyxie.setState((s) => ({
      settings: { ...s.settings, alarmEnabled: true, alarmHour: target.getHours(), alarmMinute: target.getMinutes() },
    }));
    const spy = vi.spyOn(usePyxie.getState(), 'fireAlarm');
    renderHook(() => useDailyAlarm());
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(spy).toHaveBeenCalledWith(target.toDateString());
  });

  it('does not fire when alarmEnabled is false', () => {
    const target = new Date();
    target.setSeconds(0, 0);
    vi.setSystemTime(target);
    usePyxie.setState((s) => ({
      settings: { ...s.settings, alarmEnabled: false, alarmHour: target.getHours(), alarmMinute: target.getMinutes() },
    }));
    const spy = vi.spyOn(usePyxie.getState(), 'fireAlarm');
    renderHook(() => useDailyAlarm());
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not fire twice for the same day', () => {
    const target = new Date();
    target.setSeconds(0, 0);
    vi.setSystemTime(target);
    usePyxie.setState((s) => ({
      settings: { ...s.settings, alarmEnabled: true, alarmHour: target.getHours(), alarmMinute: target.getMinutes() },
      ui: { ...s.ui, lastAlarmFired: target.toDateString() },
    }));
    const spy = vi.spyOn(usePyxie.getState(), 'fireAlarm');
    renderHook(() => useDailyAlarm());
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not fire when the minute does not match', () => {
    const target = new Date();
    target.setSeconds(0, 0);
    vi.setSystemTime(target);
    usePyxie.setState((s) => ({
      settings: { ...s.settings, alarmEnabled: true, alarmHour: (target.getHours() + 1) % 24, alarmMinute: 0 },
    }));
    const spy = vi.spyOn(usePyxie.getState(), 'fireAlarm');
    renderHook(() => useDailyAlarm());
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useInstallPromptCapture', () => {
  it('captures beforeinstallprompt into the store and prevents default', () => {
    renderHook(() => useInstallPromptCapture());
    const ev = new Event('beforeinstallprompt');
    const prevented = vi.spyOn(ev, 'preventDefault');
    window.dispatchEvent(ev);
    expect(prevented).toHaveBeenCalled();
    expect(usePyxie.getState().deferredPrompt).toBe(ev);
  });

  it('clears prompt and dismisses nudge on appinstalled', () => {
    usePyxie.setState({ deferredPrompt: new Event('beforeinstallprompt') as never });
    renderHook(() => useInstallPromptCapture());
    window.dispatchEvent(new Event('appinstalled'));
    expect(usePyxie.getState().deferredPrompt).toBeNull();
    expect(usePyxie.getState().installNudgeDismissed).toBe(true);
  });

  it('removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useInstallPromptCapture());
    unmount();
    window.dispatchEvent(new Event('beforeinstallprompt'));
    expect(usePyxie.getState().deferredPrompt).toBeNull();
  });
});

describe('useIosInstallNudge', () => {
  const originalUA = navigator.userAgent;
  function setUA(ua: string) {
    Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
  }
  afterEach(() => { setUA(originalUA); });

  it('returns show=false on non-iOS UA', () => {
    setUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    usePyxie.setState({ history: makeHistory(3) });
    const { result } = renderHook(() => useIosInstallNudge());
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.show).toBe(false);
  });

  it('flips show to true after 600ms on iOS Safari with 3 workouts', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
    usePyxie.setState({ history: makeHistory(3), installNudgeDismissed: false });
    const { result } = renderHook(() => useIosInstallNudge());
    expect(result.current.show).toBe(false);
    act(() => { vi.advanceTimersByTime(600); });
    expect(result.current.show).toBe(true);
  });

  it('dismiss() flips show back to false', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
    usePyxie.setState({ history: makeHistory(3), installNudgeDismissed: false });
    const { result } = renderHook(() => useIosInstallNudge());
    act(() => { vi.advanceTimersByTime(600); });
    expect(result.current.show).toBe(true);
    act(() => { result.current.dismiss(); });
    expect(result.current.show).toBe(false);
  });

  it('does not arm timeout when nudge was previously dismissed', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
    usePyxie.setState({ history: makeHistory(3), installNudgeDismissed: true });
    const { result } = renderHook(() => useIosInstallNudge());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.show).toBe(false);
  });
});

describe('usePersistenceLifecycle', () => {
  it('persists when document becomes hidden', () => {
    const spy = vi.spyOn(usePyxie.getState(), 'persist');
    renderHook(() => usePersistenceLifecycle());
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(spy).toHaveBeenCalled();
  });

  it('does not persist when visibility flips to visible', () => {
    const spy = vi.spyOn(usePyxie.getState(), 'persist');
    renderHook(() => usePersistenceLifecycle());
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('persists on pagehide', () => {
    const spy = vi.spyOn(usePyxie.getState(), 'persist');
    renderHook(() => usePersistenceLifecycle());
    window.dispatchEvent(new Event('pagehide'));
    expect(spy).toHaveBeenCalled();
  });

  it('removes listeners on unmount', () => {
    const spy = vi.spyOn(usePyxie.getState(), 'persist');
    const { unmount } = renderHook(() => usePersistenceLifecycle());
    unmount();
    spy.mockClear();
    window.dispatchEvent(new Event('pagehide'));
    expect(spy).not.toHaveBeenCalled();
  });
});
