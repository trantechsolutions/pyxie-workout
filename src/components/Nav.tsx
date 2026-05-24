import { usePyxie } from '../store/usePyxie';
import type { Tab } from '../store/types';

const TABS: Array<[Tab, string]> = [['pet', 'Pet'], ['workout', 'Workout'], ['settings', 'Settings']];

export function Nav() {
  const pet = usePyxie((s) => s.pet);
  const tab = usePyxie((s) => s.ui.tab);
  const setTab = usePyxie((s) => s.setTab);
  const familyEnabled = usePyxie((s) => s.settings.familyFeaturesEnabled);
  const inFamily = usePyxie((s) => s.inFamily);
  const workoutDisabled = !pet;
  // ADR-0007: Family tab is gated on BOTH the settings toggle and active
  // membership. Solo users (toggle off) and signed-in-but-not-in-a-family
  // users see no extra chrome.
  const showFamilyTab = familyEnabled && inFamily;
  return (
    <nav className="nav">
      <div className="nav-inner" id="nav">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            className={`nav-btn ${tab === k ? 'active' : ''}`}
            disabled={k === 'workout' && workoutDisabled}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
        {showFamilyTab && (
          <button
            className={`nav-btn ${tab === 'family' ? 'active' : ''}`}
            onClick={() => setTab('family')}
          >
            Family
          </button>
        )}
        <a className="nav-btn" href="/wiki">Wiki</a>
      </div>
    </nav>
  );
}
