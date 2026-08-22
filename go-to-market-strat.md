# CaliQuest — Go-to-Market Strategy

Status: draft, 2026-08-22. Covers three questions: how we get users once the
app is on the App Store, how we build community, and how we ultimately
monetise. Written against what's actually shipped today — squads, friends,
gyms (with geolocation + reviews + leaderboard), competitions (tied to real
gyms, see [competitions-feature-design.md](./competitions-feature-design.md)),
skills tree, quests, streaks, prestige tiers, and the AI coach work on
[AI-roadmap.md](./AI-roadmap.md) — not a generic fitness-app playbook.

## 1. Getting users

The wedge is real-world gyms and competitions, not generic fitness-app
acquisition. Calisthenics/street workout is a small, tight, video-native
community with a lot of existing offline infrastructure (parks, local
competitions, federations) — that's an unusually good fit for what's already
built.

- **Supply-side seed via the competitions feature.** Find actual street
  workout parks, gyms, and local competition organizers and get them to
  create their gym and register a real upcoming competition. One real
  competition run through the app pulls in a whole cohort of competitors and
  spectators who all need accounts to register/follow standings — the same
  playbook Strava used with cycling clubs and Meetup used city-by-city. It's
  the highest-leverage channel available because the schema already supports
  it (`entry_fee_minor_units`, waitlisting, gym-scoped discovery).
- **Creator seeding, not ads.** Calisthenics lives on TikTok/Reels/YouTube
  Shorts. Give 10–20 mid-tier creators early access plus a custom title/badge,
  ask them to post their skills-tree progress or squad leaderboard rank.
  Cheap, and content native to the app (skill unlocks, prestige tiers) is
  inherently shareable — the product should output the marketing content,
  not a separate pipeline.
- **ASO.** Keywords: "calisthenics," "street workout," "pull-up progression,"
  "bodyweight training." Screenshots should sell the *game* (skills tree,
  squad leaderboard, avatar) — a generic set-tracker screenshot loses to
  Strong/Hevy on their own turf.
- **Referral loop tied to squads, not cash.** "Invite friends" is already on
  the roadmap — reward successful invites with XP/cosmetics (Duolingo
  gems/streak-freeze pattern), not discounts. Squads are naturally viral: a
  squad is more fun with friends in it, so invite pressure is built into the
  mechanic once it exists.
- **Partner with existing street-workout competition series/federations**
  (Bar Brothers-style events, local street workout federations) to be their
  registration/leaderboard tool. Same reasoning as gym seeding — offering
  free infrastructure for something they already do.

## 2. Building community

The primitives exist; the job is activating them so leaving feels costly.

- **Squads as the retention core.** Individual XP grinding is soloable and
  abandon-able; a squad with shared challenges, pooled XP, and squad-vs-squad
  leaderboards makes quitting a social cost, not just a personal one. Highest
  leverage thing to invest in next.
- **Gym pages as local hubs.** Every gym is already a page with a leaderboard
  and reviews — push toward "claim your gym" so gym regulars/owners become
  de facto community moderators, the way Untappd did for bars.
- **Competitions as the online→offline bridge.** The strongest community
  mechanic because it converts app engagement into an actual meetup. Once
  notifications ship (phase 2, per the competitions doc), competition
  reminders and waitlist-promotion pushes will meaningfully lift this.
- **Seasons.** Reset leaderboards periodically (like a game season) so a new
  user isn't staring at a leaderboard they can never touch — a known
  retention killer in social-competitive apps once a cohort has a year's
  head start.
- **Shareable cards.** "Shareable workout summary card" is already on the
  roadmap — extend the same idea to skill unlocks and prestige-tier
  promotions. Every one posted to a story is a free ad that also flatters the
  poster, which is why it gets posted.
- **Moderation, ahead of scale.** Right now anyone can create a gym or
  competition with no queue (per the competitions doc) — fine at current
  scale, not fine once strangers can spam listings. Worth a lightweight
  report flow before this becomes a problem, not after.

## 3. Monetisation

Given a young, price-sensitive-but-status-motivated audience, sequence three
tiers and explicitly avoid a fourth.

1. **CaliQuest+ subscription** (Strava/Duolingo pattern) — advanced
   analytics/history export, unlimited AI coach queries (`guru.service.ts`
   plus the vision form-check stretch goal on the AI roadmap are natural
   premium hooks), unlimited squad size / unlimited competitions created.
   **Never paywall the core loop** (logging, XP, skills tree, leaderboard,
   squads) — that's the engine that makes people invite friends and post;
   gating it kills the acquisition flywheel above.
2. **Cosmetics.** The 3D flex avatar already exists; skins/outfits, profile
   frames, title colors are low-friction, high-margin, and — critically for
   a competitive leaderboard product — don't create pay-to-win resentment.
3. **B2B: gym/organizer tools.** The most underrated option given what's
   already built. Gyms and competition organizers have money and a direct
   incentive to pay for exposure to the user base: verified gym badge,
   promoted placement in `/gyms` and `/competitions`, a cut of paid entry
   fees (Eventbrite-style — `entry_fee_minor_units`/`currency` already exist
   for this), or check-in/results tooling — several of which the
   competitions doc already lists as "explicitly out of scope for v1," i.e.
   the schema anticipates this. Viable once there's a real gym network (a
   dozen-plus active gyms running competitions through the app), which is
   also why acquisition should lead with gym/competition seeding.
4. **Avoid:** pay-to-win XP boosts or anything that affects standing on a
   leaderboard people are socially invested in — the fastest way to poison
   the trust the competitive/community mechanics depend on.

## Rough sequencing

Ship to the App Store → seed via gym/competition organizers (supply) and
calisthenics creators (demand) → invest in squads + seasons to lock in
retention → once there's healthy D30 retention and a few thousand MAU, layer
in CaliQuest+ (cosmetics + AI coach) → once there's a real multi-gym network
effect, open the B2B organizer tooling.
