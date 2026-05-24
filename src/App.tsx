import { useEffect, lazy, Suspense } from 'react';
import { usePyxie } from './store/usePyxie';
import { Hud } from './components/Hud';
import { Nav } from './components/Nav';
import { EvolutionFlash } from './components/EvolutionFlash';
import { InstallModal } from './components/InstallModal';
import { Pet } from './screens/Pet';
import { Workout } from './screens/Workout';
import { WorkoutTimer } from './screens/WorkoutTimer';
import { Settings } from './screens/Settings';
import { Dead } from './screens/Dead';

// ADR-0007: Family screen and its hooks live in a separate chunk so solo
// users never download the constellation code on first paint.
const Family = lazy(() => import('./screens/Family').then((m) => ({ default: m.Family })));

import { usePersistenceLifecycle } from './hooks/usePersistenceLifecycle';
import { useDecayLoop } from './hooks/useDecayLoop';
import { useInstallPromptCapture } from './hooks/useInstallPromptCapture';
import { useIosInstallNudge } from './hooks/useIosInstallNudge';
import { useDailyAlarm } from './hooks/useDailyAlarm';
import { useSyncFlusher } from './hooks/useSyncFlusher';

function ScreenRouter() {
  const pet = usePyxie((s) => s.pet);
  const tab = usePyxie((s) => s.ui.tab);
  const workoutActive = usePyxie((s) => s.ui.workoutActive);

  if (pet && !pet.alive) return <Dead />;
  if (pet && workoutActive) return <WorkoutTimer />;
  if (tab === 'settings') return <Settings />;
  if (tab === 'family') {
    return (
      <Suspense fallback={<div className="panel-sub">Loading…</div>}>
        <Family />
      </Suspense>
    );
  }
  if (pet && tab === 'workout') return <Workout />;
  return <Pet />;
}

// Module-scope guard: persistence must hydrate exactly once per page load.
// Defensive — main.tsx no longer swaps the Root tree mid-session (family
// toggles reload the page instead), but if a future change reintroduces a
// remount, re-hydrating would clobber unflushed in-memory state.
let hasHydrated = false;

export function App() {
  const hydrate = usePyxie((s) => s.hydrate);
  useEffect(() => {
    if (hasHydrated) return;
    hasHydrated = true;
    hydrate();
  }, [hydrate]);

  usePersistenceLifecycle();
  useDecayLoop();
  useInstallPromptCapture();
  useDailyAlarm();
  useSyncFlusher();
  const iosNudge = useIosInstallNudge();

  return (
    <>
      <div className="app">
        <div className="title">PYXIE</div>
        <div className="subtitle">Pixel Pet · Calisthenics</div>
        <Hud />
        <div className="screen"><div className="screen-inner"><ScreenRouter /></div></div>
      </div>
      <Nav />
      <EvolutionFlash />
      {iosNudge.show && <InstallModal onDismiss={iosNudge.dismiss} />}
    </>
  );
}
