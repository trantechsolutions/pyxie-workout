import { getClerkSession } from './auth';
import type { ConstellationResponse } from './familyTypes';

// ADR-0007: thin authenticated client for /api/families/* and /api/family/*.
// Every helper either resolves to a typed payload, throws a `FamilyApiError`
// with the HTTP status attached, or — for the explicitly-handled 404 case —
// resolves to a `not_found` discriminant. Callers should treat absence of a
// Clerk session as "not signed in" rather than an error.

export class FamilyApiError extends Error {
  status: number;
  // Chaos H2: rate-limited responses (429) carry the retry-after duration so
  // the UI can show a friendly "try again in N minutes" message instead of a
  // generic error.
  retryAfterMs?: number;
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.name = 'FamilyApiError';
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
  }
}

export interface FamilyMember {
  user_id: string;
  display_name: string;
  joined_at: string;
}

export interface FamilyPayload {
  id: string;
  name: string;
  invite_code: string;
  // Chaos M7: surfaced from the server so the client can render the rotate-
  // code button only for the actual creator. Null for orphaned families.
  created_by: string | null;
  members: FamilyMember[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const { token } = await getClerkSession();
  if (!token) throw new FamilyApiError('Not signed in', 401);
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

async function parseError(res: Response): Promise<never> {
  let message = `Request failed (${res.status})`;
  let retryAfterMs: number | undefined;
  try {
    const body = (await res.json()) as { error?: string; retryAfterMs?: number };
    if (body?.error) message = body.error;
    if (typeof body?.retryAfterMs === 'number') retryAfterMs = body.retryAfterMs;
  } catch { /* swallow */ }
  if (res.status === 429 && retryAfterMs === undefined) {
    // Fall back to the Retry-After header (seconds) if the body lacked it.
    const header = res.headers.get('retry-after');
    const secs = header ? Number(header) : NaN;
    if (Number.isFinite(secs)) retryAfterMs = Math.max(0, secs * 1000);
  }
  throw new FamilyApiError(message, res.status, retryAfterMs);
}

// Sync the user's display name from Clerk to the server. Called once per
// sign-in so the constellation shows "Jonny" instead of the email-local-part
// fallback or "Friend".
export async function syncMe(displayName: string): Promise<void> {
  const headers = await authHeaders();
  await fetch('/api/me', {
    method: 'POST',
    headers,
    body: JSON.stringify({ display_name: displayName }),
  });
}

// Push the user's current pet visual state so other family members can render
// it in the constellation. Egg state is encoded as `lineage_id = ''` (matches
// the local convention in petSlice). Called whenever the pet visually changes.
export interface PetSnapshotPayload {
  line: string;
  stage: number;
  lineage_id: string;
  sprite_state: Record<string, unknown>;
}

export async function syncPetSnapshot(snap: PetSnapshotPayload): Promise<void> {
  const headers = await authHeaders();
  await fetch('/api/pet-snapshot', {
    method: 'PUT',
    headers,
    body: JSON.stringify(snap),
  });
}

export async function fetchMyFamily(): Promise<FamilyPayload | null> {
  const headers = await authHeaders();
  const res = await fetch('/api/families/mine', { headers });
  if (res.status === 404) return null;
  if (!res.ok) await parseError(res);
  return (await res.json()) as FamilyPayload;
}

export async function createFamily(name: string): Promise<FamilyPayload> {
  const headers = await authHeaders();
  const res = await fetch('/api/families/create', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as FamilyPayload;
}

export async function joinFamily(inviteCode: string): Promise<FamilyPayload> {
  const headers = await authHeaders();
  const res = await fetch('/api/families/join', {
    method: 'POST',
    headers,
    body: JSON.stringify({ invite_code: inviteCode }),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as FamilyPayload;
}

export async function leaveFamily(): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch('/api/families/membership', {
    method: 'DELETE',
    headers,
  });
  if (!res.ok && res.status !== 204) await parseError(res);
}

export async function rotateInviteCode(): Promise<{ invite_code: string }> {
  const headers = await authHeaders();
  const res = await fetch('/api/families/rotate-code', {
    method: 'POST',
    headers,
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as { invite_code: string };
}

export async function fetchConstellation(): Promise<ConstellationResponse | null> {
  const headers = await authHeaders();
  const res = await fetch('/api/family/constellation', { headers });
  if (res.status === 404) return null;
  if (!res.ok) await parseError(res);
  return (await res.json()) as ConstellationResponse;
}
