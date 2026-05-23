import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import { todayKey } from '../lib/time';

const POLL_MS = 30 * 1000;

export function useDailyAlarm(): void {
  const alarmEnabled = usePyxie((s) => s.settings.alarmEnabled);
  const alarmHour = usePyxie((s) => s.settings.alarmHour);
  const alarmMinute = usePyxie((s) => s.settings.alarmMinute);
  const lastAlarmFired = usePyxie((s) => s.ui.lastAlarmFired);
  const fireAlarm = usePyxie((s) => s.fireAlarm);

  useEffect(() => {
    const id = setInterval(() => {
      if (!alarmEnabled) return;
      const now = new Date();
      const key = todayKey(now);
      if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute && lastAlarmFired !== key) {
        fireAlarm(key);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [alarmEnabled, alarmHour, alarmMinute, lastAlarmFired, fireAlarm]);
}
