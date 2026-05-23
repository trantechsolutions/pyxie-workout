import { useState } from 'react';
import { usePyxie } from '../../store/usePyxie';
import { requestNotificationPerm } from '../../lib/audio';

export function AlarmSection() {
  const settings = usePyxie((s) => s.settings);
  const toggleAlarm = usePyxie((s) => s.toggleAlarm);
  const setAlarmTime = usePyxie((s) => s.setAlarmTime);

  const [hourInput, setHourInput] = useState(String(settings.alarmHour).padStart(2, '0'));
  const [minInput, setMinInput] = useState(String(settings.alarmMinute).padStart(2, '0'));

  const commitTime = () => {
    const h = parseInt(hourInput, 10);
    const m = parseInt(minInput, 10);
    const validH = !isNaN(h) && h >= 0 && h < 24 ? h : settings.alarmHour;
    const validM = !isNaN(m) && m >= 0 && m < 60 ? m : settings.alarmMinute;
    setAlarmTime(validH, validM);
  };

  const handleAlarmToggle = () => {
    toggleAlarm();
    if (!settings.alarmEnabled) requestNotificationPerm();
  };

  return (
    <>
      <div className="row">
        <div>
          <div className="row-label">Daily alarm</div>
          <div className="row-sub">Notification when this tab is open</div>
        </div>
        <div className={`toggle ${settings.alarmEnabled ? 'on' : ''}`} onClick={handleAlarmToggle}></div>
      </div>
      <div className="row">
        <div>
          <div className="row-label">Alarm time</div>
          <div className="row-sub">24-hour format</div>
        </div>
        <div className="time-input">
          <input type="text" value={hourInput} maxLength={2}
            onChange={(e) => setHourInput(e.target.value)} onBlur={commitTime} />
          <span>:</span>
          <input type="text" value={minInput} maxLength={2}
            onChange={(e) => setMinInput(e.target.value)} onBlur={commitTime} />
        </div>
      </div>
    </>
  );
}
