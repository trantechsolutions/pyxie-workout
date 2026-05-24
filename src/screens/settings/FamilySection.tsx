import { useCallback, useEffect, useState } from 'react';
import { usePyxie } from '../../store/usePyxie';
import { loadClerk, getClerkUserId } from '../../lib/auth';
import {
  createFamily,
  fetchMyFamily,
  joinFamily,
  leaveFamily,
  rotateInviteCode,
  FamilyApiError,
  type FamilyPayload,
} from '../../lib/familyApi';

// ADR-0007: the single entry point for family lifecycle (sign-in, create,
// join, view, leave, rotate). Hidden behind the `familyFeaturesEnabled`
// toggle so solo users never see Clerk, never hit /api, never pay the
// bundle cost on first paint.

interface ClerkUserState {
  isSignedIn: boolean;
  loading: boolean;
}

function useClerkSignedIn(active: boolean): ClerkUserState {
  const [state, setState] = useState<ClerkUserState>({ isSignedIn: false, loading: active });
  useEffect(() => {
    if (!active) {
      setState({ isSignedIn: false, loading: false });
      return;
    }
    let cancelled = false;
    void loadClerk()
      .then(() => {
        if (cancelled) return;
        const w = window as unknown as { Clerk?: { user?: unknown; session?: unknown } };
        setState({ isSignedIn: !!w.Clerk?.user && !!w.Clerk?.session, loading: false });
      })
      .catch(() => { if (!cancelled) setState({ isSignedIn: false, loading: false }); });
    return () => { cancelled = true; };
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

function SignedInPanel() {
  const [family, setFamily] = useState<FamilyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const setInFamily = usePyxie((s) => s.setInFamily);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchMyFamily();
      setFamily(result);
      setInFamily(!!result);
    } catch {
      setFamily(null);
      setInFamily(false);
    } finally { setLoading(false); }
  }, [setInFamily]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Caller's clerk id via the shared helper (Chaos M7 — replaces a fragile
  // inline IIFE that read window.Clerk directly).
  const callerId = getClerkUserId();

  if (loading) return <div className="row-sub" style={{ padding: '8px 0' }}>Loading…</div>;
  if (family) {
    return <FamilyMembershipView family={family} callerId={callerId} onChanged={() => { void refresh(); }} />;
  }
  return <CreateOrJoin onChanged={() => { void refresh(); }} />;
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
  const enabled = usePyxie((s) => s.settings.familyFeaturesEnabled);
  const toggleFamilyFeatures = usePyxie((s) => s.toggleFamilyFeatures);
  const { isSignedIn, loading } = useClerkSignedIn(enabled);

  if (!enabled) {
    return (
      <div className="family-section">
        <div className="row">
          <div>
            <div className="row-label">Family features</div>
            <div className="row-sub">Show your pyxie alongside the rest of your household.</div>
          </div>
          <div className="toggle" onClick={toggleFamilyFeatures}></div>
        </div>
        <div className="row-sub" style={{ padding: '6px 0 14px' }}>
          Enabling will download the sign-in module the first time you tap it.
          You stay anonymous to other families.
        </div>
      </div>
    );
  }

  return (
    <div className="family-section">
      <div className="row">
        <div>
          <div className="row-label">Family features</div>
          <div className="row-sub">Enabled</div>
        </div>
        <div className="toggle on" onClick={toggleFamilyFeatures}></div>
      </div>
      {loading ? (
        <div className="row-sub" style={{ padding: '8px 0' }}>Loading sign-in…</div>
      ) : isSignedIn ? <SignedInPanel /> : <SignInGate />}
    </div>
  );
}
