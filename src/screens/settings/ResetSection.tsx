import { usePyxie } from '../../store/usePyxie';

export function ResetSection() {
  const resetPet = usePyxie((s) => s.resetPet);

  const handleReset = () => {
    if (confirm('Really release your pet and start fresh? This cannot be undone.')) {
      resetPet();
    }
  };

  return (
    <div style={{ marginTop: 18 }}>
      <button className="btn ghost" onClick={handleReset}>Start over (release pet)</button>
    </div>
  );
}
