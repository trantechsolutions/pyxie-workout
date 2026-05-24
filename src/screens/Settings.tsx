import { lazy, Suspense } from 'react';
import { AlarmSection } from './settings/AlarmSection';
import { SoundSection } from './settings/SoundSection';
import { CoachingSection } from './settings/CoachingSection';
import { HistorySection } from './settings/HistorySection';
import { InstallSection } from './settings/InstallSection';
import { ResetSection } from './settings/ResetSection';
import { WikiSection } from './settings/WikiSection';

// ADR-0007: family section lazy-loaded so the family API client and the
// Clerk loader path don't enter the solo bundle.
const FamilySection = lazy(() =>
  import('./settings/FamilySection').then((m) => ({ default: m.FamilySection })),
);

export function Settings() {
  return (
    <>
      <div className="panel-title">Settings</div>
      <div className="panel-sub">Configure your routine</div>
      <AlarmSection />
      <SoundSection />
      <CoachingSection />
      <Suspense fallback={<div className="row-sub" style={{ padding: '8px 0' }}>Loading family options…</div>}>
        <FamilySection />
      </Suspense>
      <HistorySection />
      <WikiSection />
      <InstallSection />
      <ResetSection />
      <div className="hint">⚠️ Browser alarms only fire when this tab is open. For real alarms, set a backup on your phone.</div>
    </>
  );
}
