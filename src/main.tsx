import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { loadClerk } from './lib/auth';
import './styles.css';

// Family features are always on: every install gets ClerkProvider on first
// paint so signing in is a single tap from any device (no Settings detour).
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<App />}>
      <ClerkWrapper>
        <App />
      </ClerkWrapper>
    </Suspense>
  </StrictMode>,
);

registerSW({ immediate: true });
