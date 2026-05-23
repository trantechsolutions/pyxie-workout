import { useEffect } from 'react';
import { usePyxie } from '../store/usePyxie';

const TICK_MS = 60 * 1000;

export function useDecayLoop(): void {
  const decayTick = usePyxie((s) => s.decayTick);

  useEffect(() => {
    decayTick();
    const id = setInterval(decayTick, TICK_MS);
    return () => clearInterval(id);
  }, [decayTick]);
}
