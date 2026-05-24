import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Family } from '../../src/screens/Family';

const originalFetch = globalThis.fetch;
const originalClipboard = (navigator as unknown as { clipboard?: unknown }).clipboard;

function setClerk() {
  (window as unknown as { Clerk?: unknown }).Clerk = {
    session: { getToken: async () => 'tok' },
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const PAYLOAD = {
  family: { id: 'fam_1', name: 'Trans Clan', invite_code: 'XYZ123' },
  members: [
    {
      user_id: 'u_active', display_name: 'Ada',
      sprite: { line: 'ember', stage: 0, lineage_id: 'ember', sprite_state: {} },
      last_activity_at: '2026-05-23T01:00:00Z',
      status: 'active',
    },
    {
      user_id: 'u_rest', display_name: 'Lin',
      sprite: { line: 'tide', stage: 1, lineage_id: 'tide', sprite_state: {} },
      last_activity_at: '2026-05-21T01:00:00Z',
      status: 'drifting',
    },
    {
      user_id: 'u_sleep', display_name: 'Pat',
      sprite: { line: 'verdant', stage: 2, lineage_id: 'verdant', sprite_state: {} },
      last_activity_at: null,
      status: 'sleeping',
    },
  ],
};

beforeEach(() => {
  setClerk();
  globalThis.fetch = vi.fn(async () => jsonResponse(200, PAYLOAD)) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete (window as unknown as { Clerk?: unknown }).Clerk;
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  }
  vi.restoreAllMocks();
});

describe('Family screen', () => {
  it('renders three members across three status pills', async () => {
    render(<Family />);
    await waitFor(() => expect(screen.getByText('Trans Clan')).toBeInTheDocument());
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Lin')).toBeInTheDocument();
    expect(screen.getByText('Pat')).toBeInTheDocument();
    // Encouraging copy only — no penalizing words.
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('resting')).toBeInTheDocument();
    expect(screen.getByText('asleep')).toBeInTheDocument();
  });

  it('never uses penalizing copy in the DOM', async () => {
    render(<Family />);
    await waitFor(() => expect(screen.getByText('Trans Clan')).toBeInTheDocument());
    const text = document.body.textContent ?? '';
    // Allowed: "active", "resting", "asleep". Banned anywhere in the pane.
    expect(text.toLowerCase()).not.toContain('inactive');
    expect(text.toLowerCase()).not.toContain('lapsed');
    expect(text.toLowerCase()).not.toContain('fallen behind');
    expect(text.toLowerCase()).not.toContain('missing');
  });

  it('exposes the invite code via clipboard when copied', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<Family />);
    await waitFor(() => expect(screen.getByText('Trans Clan')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Invite'));
    expect(screen.getByText('XYZ123')).toBeInTheDocument();
  });

  it('shows the solo invite empty-state when only one member', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'Solo', invite_code: 'ABC123' },
      members: [PAYLOAD.members[0]],
    })) as unknown as typeof fetch;
    render(<Family />);
    await waitFor(() => expect(screen.getByText('Solo')).toBeInTheDocument());
    expect(screen.getByText(/Your constellation grows when family joins/)).toBeInTheDocument();
  });

  it('shows the quiet-day footer when nobody is active', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(200, {
      family: { id: 'fam_1', name: 'Quiet', invite_code: 'ABC123' },
      members: [
        { ...PAYLOAD.members[1] },
        { ...PAYLOAD.members[2] },
      ],
    })) as unknown as typeof fetch;
    render(<Family />);
    await waitFor(() => expect(screen.getByText('Quiet')).toBeInTheDocument());
    expect(screen.getByText(/A quiet day/)).toBeInTheDocument();
  });
});
