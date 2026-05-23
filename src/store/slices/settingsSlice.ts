import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../../data/constants';
import { clampAlarm } from '../../lib/progression';
import { beep } from '../../lib/audio';
import type { PyxieSlice } from './types';

export interface SettingsSlice {
  settings: Settings;

  toggleAlarm: () => void;
  toggleSound: () => void;
  setAlarmTime: (h: number, m: number) => void;
  fireAlarm: (key?: string) => void;
}

export const createSettingsSlice: PyxieSlice<SettingsSlice> = (set, get) => ({
  settings: { ...DEFAULT_SETTINGS },

  toggleAlarm: () => set((s) => ({ settings: { ...s.settings, alarmEnabled: !s.settings.alarmEnabled } })),
  toggleSound: () => set((s) => ({ settings: { ...s.settings, soundOn: !s.settings.soundOn } })),
  setAlarmTime: (h, m) => {
    const clamped = clampAlarm(h, m);
    if (!clamped) return;
    set((s) => ({ settings: { ...s.settings, alarmHour: clamped.hour, alarmMinute: clamped.minute } }));
  },

  fireAlarm: (key) => {
    const { settings, pet } = get();
    const k = key ?? new Date().toDateString();
    set((s) => ({ ui: { ...s.ui, lastAlarmFired: k } }));
    beep('alarm', settings.soundOn);
    if ('Notification' in window && Notification.permission === 'granted' && pet) {
      new Notification('Pyxie wants to train!', { body: 'Your daily 10-minute workout is calling.' });
    }
  },
});
