import { usePyxie } from '../../store/usePyxie';

export function HistorySection() {
  const history = usePyxie((s) => s.history);

  return (
    <div style={{ marginTop: 18 }}>
      <div className="field-label">Recent workouts</div>
      {history.length === 0 ? (
        <div className="row-sub" style={{ padding: '8px 0' }}>No history yet.</div>
      ) : (
        history.slice(0, 6).map((h, i) => {
          const date = new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return (
            <div key={i} className="history-item">
              <span>{date} · {h.intensity}/{h.complexity}</span>
              <span>+<b>{h.xpGained}</b> XP</span>
            </div>
          );
        })
      )}
    </div>
  );
}
