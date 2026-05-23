import { usePyxie } from '../../store/usePyxie';

export function CoachingSection() {
  const showExerciseGuide = usePyxie((s) => s.settings.showExerciseGuide);
  const toggleExerciseGuide = usePyxie((s) => s.toggleExerciseGuide);

  return (
    <div className="row">
      <div>
        <div className="row-label">Exercise guide</div>
        <div className="row-sub">Show form tips in preview and timer</div>
      </div>
      <div className={`toggle ${showExerciseGuide ? 'on' : ''}`} onClick={toggleExerciseGuide}></div>
    </div>
  );
}
