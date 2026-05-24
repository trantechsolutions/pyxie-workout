# Thinking session — Family Constellation feature — 2026-05-23

## What we explored
How to turn Pyxie into a social experience for families working out together — specifically, how to render a household of pyxies in a single shared pane that *feels like a family* without making anyone feel penalized when they lapse.

## Options considered
1. **Constellation** — pyxies orbit a shared center; activity affects position/visibility. *(picked)*
2. **Hearth/Campfire** — pyxies gather in a shared scene, stand up to work out, sit back down after.
3. **Relay** — pyxies pass a baton/torch between family members across the day.
4. **Team Sprite** — the family is a single composite creature shaped by everyone's contributions.
5. **Shared streak/quest with celebration cutscene** — no ambient pane at all; the family view is the reward, not the steady state.

## Where you landed
**Constellation, redesigned to be encouraging-not-penalizing.** Fits the fantasy pyxie metaphor and the stated goal of *motivation without shame*.

## Design decisions locked in

**Two surfaces, two tones:**
- **Shared family pane (public):** warm and encouraging. No dimming, no fading. Inactive pyxies *drift outward* (still equally bright) or *curl up asleep*. Active pyxies pull toward the center with motion/sparkles. Returning lapsed members get a visible celebration beat — other pyxies turn toward them, family acknowledges the return.
- **Personal home screen (private):** more honest. Your own pyxie looks sleepy when you've lapsed, may carry a gentle "miss you" message from the family. Private accountability, public warmth.

**Presence model:** aggregate state, not live presence. Defer real-time/websocket work until the user base justifies it. The pane reflects "what's happened recently," not "who is moving right now."

**Lapse threshold:** 3 days of no activity → pyxie curls up to sleep in the constellation. Forgives rest days and busy weekdays; short enough to still mean something.

## Reasoning behind it
Constellation matches the fantasy metaphor, scales visually for any family size, and separates *position* (which can change without shaming) from *brightness* (which we deliberately keep constant). The shared-vs-personal split resolves the core tension: pure encouragement can remove the pull to return, so the personal surface carries the gentle accountability while the family surface stays unconditionally warm.

## Concerns to track
- **Encouragement-only may weaken the motivational pull.** Watch for: families where everyone is "asleep" in the constellation and nobody returns. If that pattern emerges, the personal-surface nudge may need to be stronger, or the family pane may need a subtle "hey, the constellation has been quiet" prompt to one member.
- **Scope creep on the personal pyxie state.** The home-screen pyxie now has a "lapsed/sleepy" state that has to stay in sync with constellation logic. Not huge, but real — make sure it's modeled in one place.
- **Aggregate state has to be defined precisely.** What does "active today" mean — workout completed? workout started? logged? Pick one and stick to it, because the constellation's daily rhythm depends on it.
- **Family setup/invite flow is undesigned.** How families form, who can see whom, what happens when someone leaves a family — all open.

## Recommended next action
Sketch the constellation pane at three states on paper or in your design tool: (1) everyone active today, (2) two members active / one asleep, (3) a lapsed member returning. If the asleep state still feels *cozy* and not *sad* in the sketch, the design is working. If it reads as "missing person," iterate on the sleep visual before writing code.

## Suggested handoff
This is mature enough to hand to **`solution-architect`** when you're ready — it would turn the design into an ADR covering data model (per-user activity events, family membership, daily roll-up), the sync strategy for aggregate state, and the two-surface architecture. Not urgent; the paper sketch comes first.
