import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';
import type { Intensity, Complexity } from '../store/types';
import { ensureAudioCtx } from '../lib/audio';
import { SegmentedControl } from '../components/SegmentedControl';

const INTENSITIES: readonly Intensity[] = ['easy', 'medium', 'hard'];
const COMPLEXITIES: readonly Complexity[] = ['beginner', 'intermediate', 'advanced'];

export function Workout() {
  const settings = usePyxie((s) => s.settings);
  const previewList = usePyxie((s) => s.ui.previewList);
  const setIntensity = usePyxie((s) => s.setIntensity);
  const setComplexity = usePyxie((s) => s.setComplexity);
  const buildPreview = usePyxie((s) => s.buildPreview);
  const rerollPreview = usePyxie((s) => s.rerollPreview);
  const startWorkout = usePyxie((s) => s.startWorkout);

  useEffect(() => { buildPreview(); }, [buildPreview, settings.intensity, settings.complexity]);

  const handleStart = () => {
    ensureAudioCtx();
    startWorkout();
  };

  return (
    <>
      <div className="panel-title">Daily Workout</div>
      <div className="panel-sub">10 minutes · 8 exercises</div>
      <div className="field">
        <div className="field-label">Intensity</div>
        <SegmentedControl options={INTENSITIES} value={settings.intensity} onChange={setIntensity} />
      </div>
      <div className="field">
        <div className="field-label">Complexity</div>
        <SegmentedControl options={COMPLEXITIES} value={settings.complexity} onChange={setComplexity} />
      </div>
      <div className="hint">Format: 60s warmup → 8 exercises (45s work / 15s rest) → 60s cooldown. Tap "Start" to lock in a fresh randomized session.</div>
      {previewList && (
        <div>
          <div className="field-label preview-label">Today's set</div>
          {previewList.map((e, i) =>
            e.form && settings.showExerciseGuide ? (
              <details key={i} className="preview-item">
                <summary><span>{i + 1}. {e.name}</span><span>45s</span></summary>
                <div className="preview-form">{e.form}</div>
              </details>
            ) : (
              <div key={i} className="history-item">
                <span>{i + 1}. {e.name}</span><span>45s</span>
              </div>
            )
          )}
        </div>
      )}
      <div className="cta-grid">
        <button className="btn ghost" onClick={rerollPreview}>Reroll</button>
        <button className="btn primary" onClick={handleStart}>Start</button>
      </div>
    </>
  );
}
