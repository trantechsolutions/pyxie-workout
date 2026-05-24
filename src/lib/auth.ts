// Lazy Clerk loader (ADR-0007): solo users must NEVER download Clerk on
// first paint. Only callers that actually need auth (Family settings,
// constellation pane) should invoke loadClerk() — typically behind a
// user gesture like tapping "Enable Family Features".

export type ClerkModule = typeof import('@clerk/clerk-react');

let cached: Promise<ClerkModule> | null = null;

export function loadClerk(): Promise<ClerkModule> {
  if (!cached) {
    cached = import('@clerk/clerk-react');
  }
  return cached;
}

// Minimal Clerk session shape — narrowed locally so callers don't drag
// types from @clerk/clerk-react into the solo bundle path.
interface ClerkSessionLike {
  getToken: () => Promise<string | null>;
}
interface ClerkLike {
  session?: ClerkSessionLike | null;
  user?: { id?: string } | null;
}

export interface ClerkSession {
  token: string | null;
}

/**
 * Best-effort session lookup. Returns `{ token: null }` whenever Clerk is
 * not loaded, the user is not signed in, or the SDK throws. The contract
 * with `useSyncFlusher` and `familyApi` is: `null` token => skip the call.
 *
 * This helper exists so callers don't have to read `window.Clerk` directly
 * — the previous implicit contract was easy to break on a refactor.
 */
export async function getClerkSession(): Promise<ClerkSession> {
  if (typeof window === 'undefined') return { token: null };
  const w = window as unknown as { Clerk?: ClerkLike };
  const clerk = w.Clerk;
  if (!clerk?.session) return { token: null };
  try {
    const token = await clerk.session.getToken();
    return { token: token ?? null };
  } catch {
    return { token: null };
  }
}

/**
 * Best-effort lookup of the currently-signed-in Clerk user id, or empty
 * string if Clerk is not loaded / signed out. Mirrors getClerkSession so
 * callers stop reading window.Clerk.user.id directly (the inline IIFE
 * pattern was an easy refactor footgun — see Chaos M7).
 */
export function getClerkUserId(): string {
  if (typeof window === 'undefined') return '';
  const w = window as unknown as { Clerk?: ClerkLike };
  return w.Clerk?.user?.id ?? '';
}

// Test-only hook so suites can reset the memoized import.
export function __resetClerkLoaderForTests(): void {
  cached = null;
}
