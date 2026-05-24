import { describe, it, expect, beforeEach, vi } from 'vitest';

const fakeClerk = {
  ClerkProvider: () => null,
  useUser: () => ({ isSignedIn: false }),
  SignIn: () => null,
};

vi.mock('@clerk/clerk-react', () => fakeClerk);

import { loadClerk, __resetClerkLoaderForTests } from '../../src/lib/auth';

describe('loadClerk', () => {
  beforeEach(() => {
    __resetClerkLoaderForTests();
  });

  it('dynamically imports and resolves to a Clerk module shape', async () => {
    const mod = await loadClerk();
    expect(mod).toBeDefined();
    expect(typeof mod.ClerkProvider).toBe('function');
  });

  it('memoizes the import so repeat callers share the same promise', async () => {
    const a = loadClerk();
    const b = loadClerk();
    expect(a).toBe(b);
    await a;
  });
});
