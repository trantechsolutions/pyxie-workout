# ADR 0007: Family Constellation — Backend, Auth, and Cross-Device Sync

- **Status:** Proposed
- **Date:** 2026-05-23
- **Authors:** Jonathan V Tran
- **Related:** `docs/brainstorming/thinking-family-constellation-2026-05-23.md`

## Context
The family constellation feature (see brainstorming doc) requires showing multiple users' pyxies in one shared pane, derived from their recent workout activity across devices. Pyxie today is a single-device PWA: zustand + `persist` middleware + localStorage, no user identity, no backend. Adding family is the first cross-device feature in the project and requires introducing — for the first time — a backend, an auth model, and a network sync layer.

This ADR covers only the platform and data shape. It does not cover the constellation UI itself (rendering, animations, celebration beat) — that is downstream design.

## Decision drivers
- **Solo path must not regress.** Today's zero-friction install→play loop must remain. Family is strictly opt-in; no account required for solo use.
- **Cost at zero scale ≈ $0.** Hobby project; cannot absorb fixed infra cost on an unproven feature.
- **COPPA-style data minimization.** Families include children. Store the minimum needed; no PII on minors beyond a chosen display name.
- **Offline-first remains true.** Workout events queue locally if offline; flush on reconnect.
- **One platform if possible.** Reduce ops surface — one dashboard, one bill, one deployment target.

## Options considered
- **A. P2P / no backend** (WebRTC, shared file via iCloud/Dropbox). Avoids server cost entirely. Rejected: discovery and identity are intractable without a coordination server, kids' devices may not have shared cloud storage, and offline reconciliation is fragile.
- **B. Supabase as one-stop shop** (Auth + Postgres + Realtime). Single vendor; generous free tier. Strong fit, but adds a second deployment target alongside Vercel and forces an early bet on Supabase-specific primitives.
- **C. Vercel Functions + Neon Postgres + Clerk** (all via Vercel Marketplace). Marketplace-provisioned env vars; auth is a drop-in. App already lives on Vercel (or can without effort). Pieces are individually replaceable.
- **D. Firebase.** Mature, but its data model (Firestore) is a worse fit than SQL for the relational shape (users/families/events with joins), and the SDK is heavier on the client.

## Decision
**Option C — Vercel Functions + Neon Postgres + Clerk.**

Reasoning:
- Existing app is React + Vite, deploys cleanly as static + `/api`. Vercel Functions are an additive change, not a rewrite.
- Neon via Vercel Marketplace auto-wires `DATABASE_URL`; SQL is the right shape for the relational model.
- Clerk via Marketplace gives OAuth + magic link + React components for ~zero engineering cost; free up to 10k MAU.
- Polling-on-focus is sufficient per the thinking-doc decision to defer realtime; no websockets needed in v1.
- Each piece is individually swappable (Clerk → Auth.js, Neon → any Postgres) without a rewrite.

## Data model
Schema lives in `db/schema.sql` (new directory). See diagram in handoff document. Tables: `users`, `families`, `family_members`, `workout_events`, `pet_snapshots`. Two notable shape choices:

- **`workout_events.id` is client-generated UUIDv4.** Makes POST idempotent (`ON CONFLICT (id) DO NOTHING`), so the outbound sync queue can be naive at-least-once without server-side dedup logic.
- **`pet_snapshots` is a denormalized read model.** The family pane renders each member's pyxie remotely, so the server stores only the minimal visual subset needed by `Sprite.tsx` — not the full `Pet`. Snapshot upserted on every workout finish.

## Sync model
- **Outbound (writes):** `finishWorkout` (in `workoutSlice`) appends a `WorkoutEvent` to an in-store sync queue persisted to localStorage. A flusher (new hook, `useSyncFlusher`) drains the queue on `online`, `visibilitychange:visible`, and a 30s timer while visible. POSTs are idempotent.
- **Inbound (reads):** `GET /api/family/constellation` is called when the family pane mounts and on `visibilitychange:visible` (throttled to once per 30s). Returns the constellation array directly — status (`active`/`drifting`/`sleeping`) is computed server-side from `last_event.completed_at` against thresholds (1 day / 3 days).
- **Returning celebration:** purely client-side. The family pane keeps the previous response in memory; if any member's status flips `sleeping → active` between fetches, the celebration animation fires.

## Auth and identity
- Clerk handles sign-up, sign-in, session management. `userId = clerk_user_id` is the primary key in `users` (no separate internal ID).
- `display_name` is user-chosen at first sign-in and is the only string shown for other family members. No emails, no avatars from third parties.
- Solo users never see auth UI. The "create a family" entry point in Settings triggers the sign-in flow; the rest of the app remains anonymous.

## Family lifecycle
- A user can create one family (v1 limit) → server generates a 6-char alphanumeric invite code.
- Other users sign in, enter the code in their app, and join. No approval flow in v1.
- Code is rotatable from the family settings screen. Leaving a family is one-click; family is deleted when the last member leaves.
- Hard cap of 8 members per family in v1 — keeps the constellation visually coherent.

## Privacy and minors
- No DOB collection. No PII beyond display name.
- Workout events store intensity/complexity/timestamp only — no exercise list, no location, no biometrics.
- Family creator implicitly attests they have permission to add minors. This is the same posture as any consumer family-sharing app and is documented in a short privacy notice.
- All cross-user data scoped per-family; SQL queries gated by membership check. No cross-family reads.

## Risks & rollback
- **Identity is a one-way door.** Once a user has a Clerk account tied to their pet, removing auth is destructive. Mitigation: keep localStorage the source of truth for solo state; cloud is additive, never replaces. A user who deletes their account loses family data but keeps their pet.
- **Sync queue can grow unboundedly offline.** Mitigation: cap queue at 100 events; oldest drop with a console warning. Workout events older than 30 days never make it to the queue in the first place.
- **Free-tier cliffs are real.** Neon 0.5GB will hold ~5M `workout_events` rows; Clerk 10k MAU is the harder limit. Both are far above realistic scale at launch. Set up usage alerts at 70%.
- **Marketplace lock-in.** Provisioning via Vercel Marketplace ties billing to Vercel. Acceptable for v1; data is portable (it's standard Postgres) if migration is ever needed.
- **Rollback:** family is gated behind a settings toggle ("Enable Family Features") in the v1 release. If the backend has problems, the toggle can be remotely disabled via a config flag without breaking solo use.

## Open questions / out of scope
- **Pet sync across a user's own devices.** A user with phone + tablet today maintains two independent pets. With auth in place, single-pet-per-account becomes possible — but is out of scope for this ADR. Will need its own ADR covering merge semantics.
- **Workout completion definition.** Currently `finishWorkout(true)` fires on full timer completion. Does an early-finish-but-most-done workout count toward the family pane? Recommend: only fully-completed workouts emit events, matching what already increments `lastWorkout`.
- **Push notifications for returning members** ("Mom's pyxie woke up!"). Deferred until polling proves insufficient.
- **Web Push for "miss you" nudges on the personal surface.** Out of scope here; the personal surface remains local-only in v1 (sleepy pyxie derived from `pet.lastWorkout` — no server roundtrip needed).
