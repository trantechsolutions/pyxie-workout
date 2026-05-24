import { useCallback, useEffect, useState } from 'react';
import { usePyxie } from '../../store/usePyxie';
import { loadClerk, getClerkUserId } from '../../lib/auth';
import {
  createFamily,
  fetchMyFamily,
  joinFamily,
  leaveFamily,
  rotateInviteCode,
  syncMe,
  FamilyApiError,
  type FamilyPayload,
} from '../../lib/familyApi';

// Single entry point for family lifecycle (sign-in, create, join, view,
// leave, rotate). ClerkProvider is always mounted from main.tsx, so this
// section just routes between SignInGate / SignedInPanel based on auth
// state — no toggle, no remount dance.

interface ClerkUserState {
  isSignedIn: boolean;
  loading: boolean;
  failed: boolean;
}

// How long to wait for clerk-js to flip Clerk.loaded === true before giving
// up and surfacing a diagnostic. Seen on Fire tablets / restricted networks
// where the clerk-js chunk parses but Clerk.load() stalls indefinitely on
// blocked /v1/client requests. Without this, useClerkSignedIn polls forever
// and the Sign-in button never renders.
const CLERK_LOAD_TIMEOUT_MS = 10_000;

function useClerkSignedIn(active: boolean): ClerkUserState {
  const [state, setState] = useState<ClerkUserState>({ isSignedIn: false, loading: active, failed: false });
  useEffect(() => {
    if (!active) {
      setState({ isSignedIn: false, loading: false, failed: false });
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let pollId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    void loadClerk()
      .then(() => {
        if (cancelled) return;
        const w = window as unknown as {
          Clerk?: {
            loaded?: boolean;
            user?: unknown;
            session?: unknown;
            addListener?: (cb: () => void) => () => void;
          };
        };
        const read = () => {
          setState({ isSignedIn: !!w.Clerk?.user && !!w.Clerk?.session, loading: false, failed: false });
        };
        const attach = (): boolean => {
          if (cancelled) return true;
          if (!w.Clerk || w.Clerk.loaded !== true) return false;
          read();
          if (typeof w.Clerk.addListener === 'function') {
            unsubscribe = w.Clerk.addListener(read);
          }
          return true;
        };
        if (!attach()) {
          pollId = setInterval(() => { if (attach()) clearInterval(pollId); }, 100);
          timeoutId = setTimeout(() => {
            if (cancelled) return;
            if (pollId) clearInterval(pollId);
            setState({ isSignedIn: false, loading: false, failed: true });
          }, CLERK_LOAD_TIMEOUT_MS);
        }
      })
      .catch(() => { if (!cancelled) setState({ isSignedIn: false, loading: false, failed: true }); });
    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [active]);
  return state;
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [code]);
  return (
    <button className="btn cyan" onClick={onCopy} aria-label="Copy invite code">
      <span>{code}</span>
      <span style={{ marginLeft: 8, fontSize: '0.7rem' }}>{copied ? 'copied!' : 'copy'}</span>
    </button>
  );
}

function FamilyMembershipView({ family, callerId, onChanged }: {
  family: FamilyPayload;
  callerId: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const setInFamily = usePyxie((s) => s.setInFamily);
  // Chaos M7: only the actual creator (or claimant of an orphaned family)
  // sees the Rotate button. Falls through when the server payload predates
  // the M7 patch (created_by undefined) by defaulting to "not creator".
  const isCreator = !!callerId && family.created_by === callerId;

  const onLeave = async () => {
    setBusy(true);
    try {
      await leaveFamily();
      setInFamily(false);
      onChanged();
    } catch { /* surfaced by parent refresh */ }
    finally { setBusy(false); }
  };

  const onRotate = async () => {
    setBusy(true);
    try {
      await rotateInviteCode();
      onChanged();
    } catch { /* swallow */ }
    finally { setBusy(false); }
  };

  return (
    <div className="family-membership">
      <div className="row">
        <div>
          <div className="row-label">{family.name}</div>
          <div className="row-sub">{family.members.length} member{family.members.length === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div className="row">
        <div>
          <div className="row-label">Invite code</div>
          <div className="row-sub">Share aloud or copy</div>
        </div>
        <CopyableCode code={family.invite_code} />
      </div>
      {isCreator && (
        <div className="row">
          <div><div className="row-sub">Rotate the code if it leaks</div></div>
          <button className="btn" onClick={onRotate} disabled={busy}>Rotate code</button>
        </div>
      )}
      <div className="family-member-list">
        {family.members.map((m) => (
          <div key={m.user_id} className="history-item">
            <span>{m.display_name}{m.user_id === callerId ? ' (you)' : ''}</span>
          </div>
        ))}
      </div>
      <button className="btn red" onClick={onLeave} disabled={busy} style={{ marginTop: 10 }}>
        Leave family
      </button>
    </div>
  );
}

function CreateOrJoin({ onChanged }: { onChanged: () => void }) {
  const setInFamily = usePyxie((s) => s.setInFamily);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (name.trim().length === 0) return;
    setBusy(true); setError(null);
    try {
      await createFamily(name.trim());
      setInFamily(true);
      onChanged();
    } catch (err) {
      setError(err instanceof FamilyApiError ? err.message : 'Could not create');
    } finally { setBusy(false); }
  };

  const onJoin = async () => {
    if (code.trim().length === 0) return;
    setBusy(true); setError(null);
    try {
      await joinFamily(code.trim().toUpperCase());
      setInFamily(true);
      onChanged();
    } catch (err) {
      // Chaos H2: 429 rate-limit gets a tone-appropriate "try again in N
      // minutes" rather than the raw "rate_limited" error string.
      if (err instanceof FamilyApiError && err.status === 429) {
        const mins = Math.max(1, Math.ceil((err.retryAfterMs ?? 60_000) / 60_000));
        setError(`Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
      } else {
        setError(err instanceof FamilyApiError ? err.message : 'Could not join');
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="family-create-join">
      <div className="row">
        <div>
          <div className="row-label">Create a family</div>
          <div className="row-sub">You'll get a 6-character invite code</div>
        </div>
      </div>
      <div className="row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Family name"
          maxLength={40}
          className="text-input"
        />
        <button className="btn primary" onClick={onCreate} disabled={busy}>Create</button>
      </div>
      <div className="row">
        <div>
          <div className="row-label">Join with a code</div>
          <div className="row-sub">Ask a family member for theirs</div>
        </div>
      </div>
      <div className="row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCDEF"
          maxLength={8}
          className="text-input"
        />
        <button className="btn cyan" onClick={onJoin} disabled={busy}>Join</button>
      </div>
      {error && <div className="row-sub" style={{ color: 'var(--red)' }}>{error}</div>}
    </div>
  );
}

// Module-scope so syncMe fires exactly once per page load. The server upsert
// is idempotent but the call itself isn't free, and Settings remounts on
// every tab visit.
let syncMeFiredThisSession = false;

function SignedInPanel() {
  const family = usePyxie((s) => s.familyPayload);
  const hydrated = usePyxie((s) => s.familyHydrated);
  const setFamilyPayload = usePyxie((s) => s.setFamilyPayload);

  // Push the user's first name from Clerk to the server once per session so
  // the constellation shows "Jonny" instead of the email-local-part fallback
  // or the literal "Friend". Idempotent server-side — the gate just spares
  // the network call on every Settings revisit.
  useEffect(() => {
    if (syncMeFiredThisSession) return;
    const w = window as unknown as {
      Clerk?: { user?: { firstName?: string | null; fullName?: string | null; username?: string | null } };
    };
    const u = w.Clerk?.user;
    const name = (u?.firstName || u?.fullName || u?.username || '').trim();
    if (name.length > 0) {
      syncMeFiredThisSession = true;
      void syncMe(name).catch(() => { syncMeFiredThisSession = false; });
    }
  }, []);

  // Refetch is only triggered by mutations (create/join/leave/rotate), never
  // by mounting. The initial hydrate happens once per session in
  // useFamilyMembershipProbe, so navigating to Settings does no API calls.
  const refresh = useCallback(async () => {
    try {
      const result = await fetchMyFamily();
      setFamilyPayload(result);
    } catch {
      setFamilyPayload(null);
    }
  }, [setFamilyPayload]);

  const callerId = getClerkUserId();

  if (!hydrated) return <div className="row-sub" style={{ padding: '8px 0' }}>Loading…</div>;
  if (family) {
    return <FamilyMembershipView family={family} callerId={callerId} onChanged={() => { void refresh(); }} />;
  }
  return <CreateOrJoin onChanged={() => { void refresh(); }} />;
}

// Test-only helper so unit suites can reset the session-once syncMe flag
// between cases. Intentionally not part of the public API surface.
export function __resetFamilySectionSessionFlagsForTests(): void {
  syncMeFiredThisSession = false;
}

function ClerkLoadFailed() {
  // Surfaced when clerk-js never reports loaded within CLERK_LOAD_TIMEOUT_MS,
  // or the dynamic import rejected outright. Common on Fire tablets / Kids
  // profiles where requests to clerk.* are blocked, and on stale system
  // clocks that fail TLS. Giving the user a retry beats a silent spinner.
  const onRetry = () => { window.location.reload(); };
  return (
    <div className="row">
      <div>
        <div className="row-label">Sign-in unavailable</div>
        <div className="row-sub">
          Couldn't reach the sign-in service. Check your connection, system date,
          and that this profile isn't restricted (Amazon Kids / FreeTime blocks it).
        </div>
      </div>
      <button className="btn" onClick={onRetry}>Retry</button>
    </div>
  );
}

function SignInGate() {
  const [showing, setShowing] = useState(false);
  const onSignIn = async () => {
    setShowing(true);
    try {
      const mod = await loadClerk();
      // Use Clerk's hosted modal flow — opens an overlay; no extra
      // component tree wiring needed at this level.
      const w = window as unknown as { Clerk?: { openSignIn?: () => void } };
      if (w.Clerk?.openSignIn) {
        w.Clerk.openSignIn();
      } else {
        // SDK loaded but global not bound (e.g. provider not yet mounted).
        // Force a soft reload so ClerkProvider has a chance to attach.
        void mod;
      }
    } catch { /* ignore */ }
    setShowing(false);
  };
  return (
    <div className="row">
      <div>
        <div className="row-label">Sign in to use family</div>
        <div className="row-sub">We use sign-in only to sync across devices</div>
      </div>
      <button className="btn primary" onClick={onSignIn} disabled={showing}>Sign in</button>
    </div>
  );
}

export function FamilySection() {
  const { isSignedIn, loading, failed } = useClerkSignedIn(true);

  return (
    <div className="family-section">
      <div className="row">
        <div>
          <div className="row-label">Family</div>
          <div className="row-sub">Show your pyxie alongside the rest of your household.</div>
        </div>
      </div>
      {loading ? (
        <div className="row-sub" style={{ padding: '8px 0' }}>Loading sign-in…</div>
      ) : failed ? (
        <ClerkLoadFailed />
      ) : isSignedIn ? <SignedInPanel /> : <SignInGate />}
    </div>
  );
}
