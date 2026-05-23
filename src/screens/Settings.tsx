import { AlarmSection } from './settings/AlarmSection';
import { SoundSection } from './settings/SoundSection';
import { CoachingSection } from './settings/CoachingSection';
import { HistorySection } from './settings/HistorySection';
import { InstallSection } from './settings/InstallSection';
import { ResetSection } from './settings/ResetSection';

export function Settings() {
  return (
    <>
      <div className="panel-title">Settings</div>
      <div className="panel-sub">Configure your routine</div>
      <AlarmSection />
      <SoundSection />
      <CoachingSection />
      <HistorySection />
      <InstallSection />
      <ResetSection />
      <div className="hint">⚠️ Browser alarms only fire when this tab is open. For real alarms, set a backup on your phone.</div>
    </>
  );
}
