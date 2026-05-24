import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { loadClerk } from './lib/auth';
import './styles.css';

// ADR-0007: ClerkProvider is mounted lazily, AND only when the user has
// opted into family features. Solo users never pay the bundle cost.
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

// Read the persisted toggle synchronously at module load — before React
// renders anything. This avoids ever switching tree shape during a session:
// flipping the toggle in FamilySection triggers a full reload (see
// flushPersist() + location.reload() in the toggle handler), so by the time
// Root re-evaluates, this constant matches the new value and App mounts
// exactly once. No remount race, no double-hydrate, no auth state loss.
function readInitialFamilyEnabled(): boolean {
  try {
    const raw = localStorage.getItem('pyxie-state');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { settings?: { familyFeaturesEnabled?: unknown } };
    return parsed?.settings?.familyFeaturesEnabled === true;
  } catch {
    return false;
  }
}

const INITIAL_FAMILY_ENABLED = readInitialFamilyEnabled();

function Root() {
  if (!INITIAL_FAMILY_ENABLED) {
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
