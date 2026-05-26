import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSyncPetSnapshot } from '../../src/hooks/useSyncPetSnapshot';
import { usePyxie } from '../../src/store/usePyxie';
import * as familyApi from '../../src/lib/familyApi';
import { makePet } from '../helpers';

beforeEach(() => {
  usePyxie.setState({ pet: null, inFamily: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSyncPetSnapshot', () => {
  it('pushes when inFamily flips false -> true with stable pet', async () => {
    const spy = vi.spyOn(familyApi, 'syncPetSnapshot').mockResolvedValue();
    const pet = makePet({ name: 'P' });
    usePyxie.setState({ pet, inFamily: false });

    renderHook(() => useSyncPetSnapshot());
    expect(spy).not.toHaveBeenCalled();

    act(() => {
      usePyxie.setState({ inFamily: true });
    });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
  });

  it('backfills: pushes again on each false -> true transition for the same pet', async () => {
    const spy = vi.spyOn(familyApi, 'syncPetSnapshot').mockResolvedValue();
    const pet = makePet({ name: 'P' });
    usePyxie.setState({ pet, inFamily: false });

    renderHook(() => useSyncPetSnapshot());

    act(() => { usePyxie.setState({ inFamily: true }); });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

    act(() => { usePyxie.setState({ inFamily: false }); });
    act(() => { usePyxie.setState({ inFamily: true }); });

    // Even though pet signature is identical, the false->true transition must
    // clear the dedupe ref so the push fires again (defense-in-depth backfill).
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });

  it('does not deduplicate-skip pet-only no-op while inFamily stays true (dedupe still active)', async () => {
    const spy = vi.spyOn(familyApi, 'syncPetSnapshot').mockResolvedValue();
    const pet = makePet({ name: 'P' });
    usePyxie.setState({ pet, inFamily: true });

    renderHook(() => useSyncPetSnapshot());
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

    // Reassign an identical-shaped pet object: signature dedupe should skip.
    act(() => { usePyxie.setState({ pet: { ...pet } }); });
    await new Promise((r) => setTimeout(r, 20));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
