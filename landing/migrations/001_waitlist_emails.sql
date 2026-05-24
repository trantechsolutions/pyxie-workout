-- Run once against the same Neon database the main app uses.
-- Stores emails captured from the marketing landing page.

-- Emails are lowercased by the API before insert, so a plain UNIQUE on
-- email is sufficient (and lets us use ON CONFLICT (email) DO NOTHING).
CREATE TABLE IF NOT EXISTS waitlist_emails (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  source      TEXT NOT NULL DEFAULT 'landing',
  user_agent  TEXT,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waitlist_emails_created_at_idx
  ON waitlist_emails (created_at DESC);
