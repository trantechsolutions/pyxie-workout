import { usePyxie } from '../store/usePyxie';
import type { Tab } from '../store/types';

const TABS: Array<[Tab, string]> = [['pet', 'Pet'], ['workout', 'Workout'], ['settings', 'Settings']];

export function Nav() {
  const pet = usePyxie((s) => s.pet);
  const tab = usePyxie((s) => s.ui.tab);
  const setTab = usePyxie((s) => s.setTab);
  const workoutDisabled = !pet;
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
        <a className="nav-btn" href="/wiki">Wiki</a>
      </div>
    </nav>
  );
}
