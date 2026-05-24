-- Pyxie Family Constellation schema (ADR-0007)
-- Idempotent: safe to run repeatedly against Neon Postgres.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,                     -- clerk_user_id
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chaos H3: created_by is nullable + ON DELETE SET NULL. The previous
-- cascade-destroy meant deleting a Clerk account silently nuked the entire
-- family for everyone in it. Now the family survives as an orphan; any
-- remaining member can claim ownership via /api/families/rotate-code.
CREATE TABLE IF NOT EXISTS families (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  invite_code   TEXT NOT NULL UNIQUE,                 -- 6-char alphanumeric, ambiguity-stripped
  created_by    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent migration for existing deployments: drop the NOT NULL and the
-- old CASCADE FK so re-runs converge on the new shape.
DO $$
BEGIN
  ALTER TABLE families ALTER COLUMN created_by DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE families DROP CONSTRAINT IF EXISTS families_created_by_fkey;
  ALTER TABLE families ADD CONSTRAINT families_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS family_members (
  family_id     UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (family_id, user_id)
);

CREATE INDEX IF NOT EXISTS family_members_user_id_idx
  ON family_members (user_id);

-- A user may only be in one family at a time (v1 constraint).
CREATE UNIQUE INDEX IF NOT EXISTS family_members_user_id_unique
  ON family_members (user_id);

CREATE TABLE IF NOT EXISTS workout_events (
  id            UUID PRIMARY KEY,                     -- client-generated UUIDv4 (idempotent POST)
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL,
  intensity     TEXT NOT NULL CHECK (intensity IN ('easy','medium','hard')),
  complexity    TEXT NOT NULL CHECK (complexity IN ('beginner','intermediate','advanced')),
  xp_gained     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_events_user_completed_idx
  ON workout_events (user_id, completed_at DESC);

-- Denormalized read model for the family pane renderer (ADR-0007).
-- One row per user; upserted from the client whenever the visible pet state changes.
CREATE TABLE IF NOT EXISTS pet_snapshots (
  user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  line          TEXT NOT NULL,
  stage         INTEGER NOT NULL,
  lineage_id    TEXT NOT NULL,
  sprite_state  JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
