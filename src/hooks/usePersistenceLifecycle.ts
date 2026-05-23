import { useEffect } from 'react';
import { flushPersist } from '../store/usePyxie';

export function usePersistenceLifecycle(): void {
  useEffect(() => {
    const onVis = () => { if (document.hidden) flushPersist(); };
    const onHide = () => flushPersist();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);
}
