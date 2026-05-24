import { describe, it, expect } from 'vitest';
import { generateInviteCode, __test__ } from '../../api/_lib/families';

describe('generateInviteCode (Chaos M5)', () => {
  it('produces a 6-char code from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateInviteCode();
      expect(code).toHaveLength(__test__.CODE_LENGTH);
      for (const ch of code) {
        expect(__test__.CODE_ALPHABET).toContain(ch);
      }
    }
  });

  it('strips the ambiguous glyphs 0/O/1/I/L from the alphabet', () => {
    for (const banned of ['0', '1', 'I', 'L', 'O']) {
      expect(__test__.CODE_ALPHABET).not.toContain(banned);
    }
  });
});
