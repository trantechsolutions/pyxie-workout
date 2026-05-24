import type { NeonQueryFunction } from '@neondatabase/serverless';
import { randomInt } from 'node:crypto';

// ADR-0007: invite codes are 6-char, alphanumeric, with ambiguous glyphs
// (0/O/1/I/L) stripped so codes can be read aloud over a phone call.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_GENERATE_ATTEMPTS = 10;
export const FAMILY_MEMBER_CAP = 8;

// Chaos M5: use crypto.randomInt rather than Math.random so the code is
// unguessable from concurrent timing observations.
export function generateInviteCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

export interface FamilyMemberRow {
  user_id: string;
  display_name: string;
  joined_at: string;
}

export interface FamilyPayload {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  members: FamilyMemberRow[];
}

interface FamilyRow {
  id: string;
  name: string;
  invite_code: string;
  // Chaos H3: nullable after schema migration so an orphaned family (creator
  // deleted their account) still loads and lets remaining members claim it.
  created_by: string | null;
}

export async function findFamilyForUser(
  sql: NeonQueryFunction<false, false>,
  userId: string,
): Promise<FamilyRow | null> {
  const rows = (await sql`
    SELECT f.id, f.name, f.invite_code, f.created_by
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = ${userId}
    LIMIT 1
  `) as unknown as FamilyRow[];
  return rows[0] ?? null;
}

export async function fetchFamilyMembers(
  sql: NeonQueryFunction<false, false>,
  familyId: string,
): Promise<FamilyMemberRow[]> {
  return (await sql`
    SELECT fm.user_id, u.display_name, fm.joined_at
    FROM family_members fm
    JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ${familyId}
    ORDER BY fm.joined_at ASC
  `) as unknown as FamilyMemberRow[];
}

export async function buildFamilyPayload(
  sql: NeonQueryFunction<false, false>,
  family: FamilyRow,
): Promise<FamilyPayload> {
  const members = await fetchFamilyMembers(sql, family.id);
  return {
    id: family.id,
    name: family.name,
    invite_code: family.invite_code,
    created_by: family.created_by,
    members,
  };
}

export type { FamilyRow };

export const __test__ = {
  CODE_ALPHABET,
  CODE_LENGTH,
  MAX_GENERATE_ATTEMPTS,
};
