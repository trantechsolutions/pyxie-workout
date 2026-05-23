import { usePyxie } from '../store/usePyxie';
import type { Tab } from '../store/types';

const TABS: Array<[Tab, string]> = [['pet', 'Pet'], ['workout', 'Workout'], ['wiki', 'Wiki'], ['settings', 'Settings']];

export function Nav() {
  const pet = usePyxie((s) => s.pet);
  const tab = usePyxie((s) => s.ui.tab);
  const setTab = usePyxie((s) => s.setTab);
  if (!pet) return <nav className="nav"><div className="nav-inner" id="nav"></div></nav>;
  return (
    <nav className="nav">
      <div className="nav-inner" id="nav">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            className={`nav-btn ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
    </nav>
  );
}
