// Shared types for the family constellation. Kept in src/lib so the client
// can import them without dragging in @vercel/node from the API module.

export type ConstellationStatus = 'active' | 'drifting' | 'sleeping';

export interface ConstellationSprite {
  line: string;
  stage: number;
  lineage_id: string;
  sprite_state: Record<string, unknown>;
}

export interface ConstellationMember {
  user_id: string;
  display_name: string;
  sprite: ConstellationSprite | null;
  last_activity_at: string | null;
  status: ConstellationStatus;
}

export interface ConstellationResponse {
  family: { id: string; name: string; invite_code: string };
  members: ConstellationMember[];
}

// Chaos M7: expose `created_by` on the family payload so the client can
// correctly toggle creator-only affordances (rotate code) without the
// "always show, server 403s" workaround. `null` for an orphaned family.
export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  members: Array<{ user_id: string; display_name: string; joined_at: string }>;
}
