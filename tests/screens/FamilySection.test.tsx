import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FamilySection } from '../../src/screens/settings/FamilySection';
import { usePyxie } from '../../src/store/usePyxie';
import { DEFAULT_SETTINGS, DEFAULT_UI } from '../../src/data/constants';

// Stub the dynamic Clerk import so tests don't pull the real SDK.
vi.mock('../../src/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/auth')>('../../src/lib/auth');
  return {
    ...actual,
    loadClerk: vi.fn(async () => ({} as unknown as typeof import('@clerk/clerk-react'))),
  };
});

const originalFetch = globalThis.fetch;

function resetStore() {
  usePyxie.setState({
    pet: null,
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    installNudgeDismissed: false,
    ui: { ...DEFAULT_UI },
    deferredPrompt: null,
    evolved: null,
    eventQueue: [],
    inFamily: false,
  });
  localStorage.clear();
}

function setClerk(opts: { signedIn: boolean; userId?: string }) {
  (window as unknown as { Clerk?: unknown }).Clerk = opts.signedIn
    ? {
        user: { id: opts.userId ?? 'user_1' },
        session: { getToken: async () => 'tok' },
        openSignIn: () => {},
      }
    : { user: null, session: null, openSignIn: () => {} };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete (window as unknown as { Clerk?: unknown }).Clerk;
  vi.restoreAllMocks();
});

describe('FamilySection transitions', () => {
  it('toggle OFF: shows the enable copy and no sign-in UI', () => {
    // familyFeaturesEnabled defaults to false in DEFAULT_SETTINGS.
    render(<FamilySection />);
    expect(screen.getByText('Family features')).toBeInTheDocument();
    expect(screen.getByText(/Enabling will download the sign-in module/)).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('toggle ON + signed OUT: shows the sign-in CTA', async () => {
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    setClerk({ signedIn: false });
    render(<FamilySection />);
    await waitFor(() => expect(screen.getByText('Sign in')).toBeInTheDocument());
    expect(screen.getByText(/Sign in to use family/)).toBeInTheDocument();
  });

  it('toggle ON + signed IN + no family: shows Create + Join forms', async () => {
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    setClerk({ signedIn: true });
    // fetchMyFamily returns 404 / no family.
    globalThis.fetch = vi.fn(async () => jsonResponse(404, { error: 'no_family' })) as unknown as typeof fetch;

    render(<FamilySection />);
    await waitFor(() => expect(screen.getByText('Create')).toBeInTheDocument());
    expect(screen.getByText(/Create a family/)).toBeInTheDocument();
    expect(screen.getByText(/Join with a code/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Family name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ABCDEF')).toBeInTheDocument();
  });

  it('toggle ON + signed IN + in family: shows member list and Leave button', async () => {
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    setClerk({ signedIn: true, userId: 'user_1' });

    const familyPayload = {
      id: 'fam_1',
      name: 'Trans Clan',
      invite_code: 'ABC123',
      members: [
        { user_id: 'user_1', display_name: 'Ada', joined_at: 'a' },
        { user_id: 'user_2', display_name: 'Lin', joined_at: 'b' },
      ],
    };
    globalThis.fetch = vi.fn(async () => jsonResponse(200, familyPayload)) as unknown as typeof fetch;

    render(<FamilySection />);
    await waitFor(() => expect(screen.getByText('Trans Clan')).toBeInTheDocument());
    expect(screen.getByText('2 members')).toBeInTheDocument();
    expect(screen.getByText('Leave family')).toBeInTheDocument();
    expect(screen.getByText('Ada (you)')).toBeInTheDocument();
    expect(screen.getByText('Lin')).toBeInTheDocument();
    // No create/join forms.
    expect(screen.queryByPlaceholderText('Family name')).toBeNull();
  });

  it('singular "1 member" copy when family has exactly one member', async () => {
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    setClerk({ signedIn: true, userId: 'user_1' });
    globalThis.fetch = vi.fn(async () => jsonResponse(200, {
      id: 'fam_1', name: 'Solo', invite_code: 'ABC123',
      members: [{ user_id: 'user_1', display_name: 'Ada', joined_at: 'a' }],
    })) as unknown as typeof fetch;

    render(<FamilySection />);
    await waitFor(() => expect(screen.getByText('Solo')).toBeInTheDocument());
    expect(screen.getByText('1 member')).toBeInTheDocument();
  });

  it('clicking the Sign in CTA invokes window.Clerk.openSignIn', async () => {
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    const openSignIn = vi.fn();
    (window as unknown as { Clerk?: unknown }).Clerk = {
      user: null,
      session: null,
      openSignIn,
    };
    render(<FamilySection />);
    await waitFor(() => expect(screen.getByText('Sign in')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sign in'));
    await waitFor(() => expect(openSignIn).toHaveBeenCalled());
  });
});
