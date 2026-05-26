import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFamilyMembershipProbe } from '../../src/hooks/useFamilyMembershipProbe';
import { usePyxie } from '../../src/store/usePyxie';
import * as familyApi from '../../src/lib/familyApi';
import * as auth from '../../src/lib/auth';

type ClerkLike = {
  loaded: boolean;
  user: { id: string } | null;
  session: object | null;
  addListener: (cb: () => void) => () => void;
};

const listeners: Array<() => void> = [];

function installClerk(userId: string | null) {
  const clerk: ClerkLike = {
    loaded: true,
    user: userId ? { id: userId } : null,
    session: userId ? {} : null,
    addListener: (cb: () => void) => {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
  (window as unknown as { Clerk?: ClerkLike }).Clerk = clerk;
}

function fireListeners() {
  for (const cb of [...listeners]) cb();
}

beforeEach(() => {
  listeners.length = 0;
  vi.spyOn(auth, 'loadClerk').mockResolvedValue({} as unknown as Awaited<ReturnType<typeof auth.loadClerk>>);
  usePyxie.setState({ inFamily: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as { Clerk?: ClerkLike }).Clerk;
});

describe('useFamilyMembershipProbe', () => {
  it('retries after a failed probe (does not memoize failures)', async () => {
    installClerk('user_1');
    const spy = vi.spyOn(familyApi, 'fetchMyFamily')
      .mockRejectedValueOnce(new familyApi.FamilyApiError('transient 401', 401))
      .mockResolvedValueOnce({
        id: 'fam_1',
        name: 'F',
        invite_code: 'XYZ123',
        created_by: 'user_1',
        members: [],
      });

    renderHook(() => useFamilyMembershipProbe());

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

    // Wait past the 2-second backoff floor, then re-fire the listener — the
    // probe should run again because the first failure must not have memoized.
    await new Promise((r) => setTimeout(r, 2100));
    fireListeners();

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(usePyxie.getState().inFamily).toBe(true);
  });

  it('respects a 2-second floor between failed retries', async () => {
    installClerk('user_2');
    const spy = vi.spyOn(familyApi, 'fetchMyFamily')
      .mockRejectedValue(new familyApi.FamilyApiError('still down', 500));

    renderHook(() => useFamilyMembershipProbe());

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

    // Fire the listener immediately — backoff floor should gate this call.
    fireListeners();
    fireListeners();
    fireListeners();

    // Give microtasks a chance to settle. Spy must still be 1.
    await new Promise((r) => setTimeout(r, 50));
    expect(spy).toHaveBeenCalledTimes(1);
  }, 10000);
});
