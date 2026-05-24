import { StrictMode, lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { usePyxie } from './store/usePyxie';
import { loadClerk } from './lib/auth';
import './styles.css';

// ADR-0007: ClerkProvider is mounted lazily, AND only when the user has
// opted into family features. Solo users never pay the bundle cost.
// The lazy import resolves a tiny wrapper module that re-exports the
// already-cached Clerk module so we don't have two `clerk-react` chunks.
const ClerkWrapper = lazy(async () => {
  const mod = await loadClerk();
  const ClerkProvider = mod.ClerkProvider;
  return {
    default: ({ children }: { children: React.ReactNode }) => {
      const publishableKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ?? '';
      if (!publishableKey) {
        // Misconfigured deployment — render naked so the rest of the app
        // is still usable. The family flow will surface the error itself.
        // eslint-disable-next-line no-console
        console.warn('[main] VITE_CLERK_PUBLISHABLE_KEY missing — family features will be inert.');
        return <>{children}</>;
      }
      return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
    },
  };
});

function Root() {
  // Subscribe to the persisted toggle so the provider mounts/unmounts when
  // the user flips "Enable family features". Initial paint: providers off.
  const familyEnabled = usePyxie((s) => s.settings.familyFeaturesEnabled);
  const [hydrated, setHydrated] = useState(false);

  // Wait one tick so the persistence slice hydrates from localStorage before
  // we decide whether to mount Clerk. Otherwise enabled users would see a
  // flash of the naked tree on first paint.
  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated || !familyEnabled) {
    return <App />;
  }

  return (
    <Suspense fallback={<App />}>
      <ClerkWrapper>
        <App />
      </ClerkWrapper>
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

registerSW({ immediate: true });
