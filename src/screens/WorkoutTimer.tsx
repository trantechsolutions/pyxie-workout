import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import type { ActiveWorkout } from '../store/types';

const PHASE_LABEL: Record<string, string | ((w: ActiveWorkout) => string)> = {
  warmup: 'Warm Up',
  rest: 'Rest',
  cooldown: 'Cool Down',
  work: (w) => `Exercise ${w.segments[w.segIdx].idx ?? ''} / ${w.exList.length}`,
};

export function WorkoutTimer() {
  const w = usePyxie((s) => s.ui.workoutActive)!;
  const tickWorkout = usePyxie((s) => s.tickWorkout);
  const togglePause = usePyxie((s) => s.togglePause);
  const skipSegment = usePyxie((s) => s.skipSegment);
  const finishWorkout = usePyxie((s) => s.finishWorkout);

  useEffect(() => {
    const id = setInterval(() => tickWorkout(), 1000);
    const onVis = () => { if (!document.hidden) tickWorkout(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tickWorkout]);

  const seg = w.segments[w.segIdx];
  const total = seg.dur;
  const r = Math.max(0, w.remaining);
  const pct = (total - r) / total;
  const dash = 2 * Math.PI * 78;
  const offset = dash * (1 - pct);
  const phaseClass = seg.kind === 'rest' ? 'rest' : '';
  const mins = String(Math.floor(r / 60));
  const secs = String(r % 60).padStart(2, '0');
  const labelFn = PHASE_LABEL[seg.kind];
  const phaseLabel = typeof labelFn === 'function' ? labelFn(w) : labelFn;
  const nextName = w.segments[w.segIdx + 1]?.label;

  return (
    <div className="timer-wrap">
      <div className="timer-phase">{phaseLabel}</div>
      <div className="timer-exercise">{seg.label}</div>
      {seg.cue && <div className="timer-detail">{seg.cue}</div>}
      {seg.kind === 'rest' && seg.next && <div className="timer-detail">Next: <b>{seg.next}</b></div>}
      <div className={`timer-circle ${phaseClass}`}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle className="track" cx="90" cy="90" r="78" />
          <circle className="progress" cx="90" cy="90" r="78" strokeDasharray={dash} strokeDashoffset={offset} />
        </svg>
        <div className="timer-time">{mins}:{secs}</div>
      </div>
      <div className="timer-next">{nextName ? 'Up next: ' + nextName : 'Final stretch!'}</div>
      <div className="timer-actions">
        <button className="btn ghost" onClick={togglePause}>{w.paused ? 'Resume' : 'Pause'}</button>
        <button className="btn ghost" onClick={skipSegment}>Skip</button>
        <button className="btn ghost" onClick={() => finishWorkout(false)}>Quit</button>
      </div>
    </div>
  );
}
