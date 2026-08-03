# Gym Finder — Design Doc

Find outdoor calisthenics gyms ("park gyms") near you, rate them, tag workouts to them,
and build renown — both for the gyms and for the users who train there.

**Status:** approved design, not yet implemented.
**Build order:** Phase 1 → 2 → 3, each independently shippable.

---

## Product vision

Calisthenics' superpower is that it's free and outdoors: bars in parks, in every city,
waiting to be found. CaliQuest should hold the best community map of them.

- Users see a **map of gyms near them** and get directions to the closest bars.
- Users **rate and review** gyms; community feedback earns gyms **renown tiers**
  (a great gym becomes a *Dojo*, a legendary one a *Temple*).
- Users **tag workouts with a gym**; training somewhere often makes you a
  **Legend of that gym**, and every gym visited joins the **passport** collection
  on your profile — a collectible loop for people who train while travelling.
- Users can **add gyms** that aren't in the database yet. Community usage, not a
  moderation queue, verifies them.

## Decisions already made (do not relitigate)

1. **Seed data comes from OpenStreetMap**, imported via the Overpass API.
   Google Places is explicitly ruled out — its ToS prohibits storing place data to
   build your own database, which is exactly what this feature does.
2. **Map stack:** MapLibre GL JS + free vector tiles (OpenFreeMap, no API key).
   Loaded with `next/dynamic` + `ssr: false` (same pattern as `FlexAvatar`/three.js).
3. **Geo queries:** PostGIS in Supabase (`create extension postgis`), a
   `geography(point)` column with a GIST index, nearest-gyms via an RPC using
   `ST_DWithin` / `ST_Distance`. No external geo service.
4. **User-submitted gyms appear immediately** as unverified ("Rumored Spot") —
   no human moderation queue. Community activity promotes them to verified.
5. **Visits are derived from workouts** (`workouts.gym_id`), not a separate
   check-in table. Legends, passports, and gym activity are all views over
   workout data.

## Data sourcing

### OSM import (Phase 1)

Outdoor gym equipment in OSM is tagged `leisure=fitness_station` (nodes/ways, often
with `fitness_station:horizontal_bar=yes`, `fitness_station:parallel_bars=yes`, etc.)
and calisthenics areas as `sport=calisthenics` (also worth pulling: `sport=fitness`
combined with outdoor `leisure` values). Write a one-off import script
(`scripts/import-osm-gyms.ts` or similar, run manually — not part of the app runtime):

- Query the Overpass API (`https://overpass-api.de/api/interpreter`) for those tags.
  Import a bounded region first (e.g. the UK) to keep the first run reviewable;
  the script should accept a bounding box so more regions can be imported later.
- For ways/relations use the centroid as the gym's point.
- **Cluster nearby equipment nodes**: a single park gym is often mapped as several
  `fitness_station` nodes a few metres apart. Merge nodes within ~75m of each other
  into one gym, unioning their equipment tags.
- Store: OSM name if present (else a generated name like "Calisthenics spot, {area}"
  — resolve the area from OSM context if cheap, otherwise leave the name null and
  display coordinates-based fallback in the UI), coordinates, equipment as jsonb,
  `source='osm'`, `osm_id` (for future re-syncs and dedupe), `status='verified'`
  (OSM data counts as verified).
- Idempotent upsert on `osm_id` so re-running the script is safe.

### Licensing (ODbL) — must ship with Phase 1

- Show "Gym data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)"
  on the map screen (MapLibre attribution control is fine).
- Keep `source`/`osm_id` on every imported row so OSM-derived data stays identifiable.
- User-generated content (reviews, ratings, workout tags) is CaliQuest's own data
  and unaffected.

### User submissions (Phase 2)

- Any authenticated user can add a gym: name, location (map pin, defaulting to
  their current position), optional equipment checklist.
- **Dedupe guard:** if a gym already exists within ~100m, show it and ask
  "is this the same gym?" before allowing creation.
- New gyms get `source='user'`, `status='unverified'` → shown as "Rumored Spot".
- **Auto-verification:** promote to `verified` once ≥2 *other* users have logged a
  workout or review there. (Implement as a trigger or in the service layer —
  either is fine, keep it in one place.)

## Schema

Follow the existing `supabase/schema.sql` conventions: `create table if not exists`,
`alter table … add column if not exists` migrations for existing tables, RLS on
everything, seed-free (gyms come from the import script, not `seed.sql`).

```sql
create extension if not exists postgis;

create table if not exists public.gyms (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  location    geography(point, 4326) not null,
  source      text not null default 'user' check (source in ('osm','user')),
  osm_id      bigint unique,             -- null for user-submitted
  equipment   jsonb not null default '{}'::jsonb,
  status      text not null default 'unverified' check (status in ('unverified','verified')),
  created_by  uuid references public.profiles(user_id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists gyms_location_idx on public.gyms using gist (location);

create table if not exists public.gym_reviews (
  gym_id      uuid references public.gyms(id) on delete cascade,
  user_id     uuid references public.profiles(user_id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  primary key (gym_id, user_id)          -- one review per user per gym; edits replace
);

-- Phase 3
alter table public.workouts add column if not exists gym_id uuid references public.gyms(id);
create index if not exists workouts_gym_idx on public.workouts (gym_id) where gym_id is not null;
```

### Nearest-gyms RPC

```sql
-- security definer not needed; gyms are readable by all authenticated users
create or replace function public.gyms_near(lat double precision, lng double precision,
                                            radius_m integer default 25000, max_results integer default 50)
returns table (id uuid, name text, lat double precision, lng double precision,
               distance_m double precision, status text, equipment jsonb) …
```

Order by distance, filter with `ST_DWithin` (indexed), return coordinates via
`ST_Y`/`ST_X` so the client never parses PostGIS types.

### RLS

- `gyms`: select for all authenticated users; insert with `created_by = auth.uid()`;
  no user updates/deletes in v1 (avoids vandalism; edits can come later with history).
- `gym_reviews`: select for all authenticated; insert/update/delete own row only.
- **Profiles caveat:** `profiles` is currently visible to self + friends only, but
  gym reviews and leaderboards must show strangers' usernames. Follow the existing
  `search_profiles_by_username` pattern: a `security definer` function returning
  only `(user_id, username, avatar_url)` for a given set of user ids. Do **not**
  open up the general profiles select policy.

## Community mechanics

### Gym renown tiers (Phase 2)

Renown is earned through **use, not just stars** — a composite of average rating,
review count, and (once Phase 3 lands) tagged-workout count, so two 5★ reviews
can't outrank a busy, well-loved gym. Compute in the service layer (a derived
value, not a stored column — cheap at this scale; denormalise later if needed).

| Tier | Criteria (initial tuning — service-layer constants, easy to adjust) |
|---|---|
| Rumored Spot | `status='unverified'` |
| Spot | verified, little/no activity |
| Yard | ≥3 reviews, avg ≥3.5 |
| Forge | ≥10 reviews, avg ≥4.0 |
| Dojo | ≥25 reviews, avg ≥4.3 |
| Temple | ≥75 reviews, avg ≥4.5 |

Phase 3 addition: fold workout counts in (e.g. each 5 tagged workouts counts like
one review toward thresholds — tune once real data exists).

### Legends & passports (Phase 3)

Per-gym user ladder, computed from `count(workouts where gym_id = X and user_id = Y)`:

| Rank | Workouts at gym |
|---|---|
| Visitor | 1+ |
| Local | 5+ |
| Regular | 15+ |
| **Legend** | 40+ |

- A gym page shows its leaderboard (top users by workout count) with ranks.
- The profile page shows the **passport**: every gym visited with the user's rank
  there — Legends first. Distinct-gym query over `workouts`.
- Deliberately threshold-based (fair, monotonic), not "current champion".
  A contested "reigning Legend" (most workouts in last 90 days) is a possible
  later addition, not in scope.

## UI

New page `src/app/(app)/gyms/page.tsx` + a bottom-nav entry (map icon).

- **Map screen (mobile-first, 375px):** full-bleed MapLibre map, gym pins
  (color/badge by tier), a bottom sheet listing nearest gyms with distance —
  respecting the fixed bottom nav (`pb-24 md:pb-6` is applied by the layout) and
  safe-area insets per CLAUDE.md. Geolocation via the browser API with a
  permission-denied fallback (text search over gym names, browse map manually).
- **Gym detail** (`gyms/[id]`): name + tier badge, equipment chips, distance,
  "Directions" link (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`
  works cross-platform), reviews, add/edit own review, (Phase 3) leaderboard.
- **Add gym** (Phase 2): map-pin picker + name + equipment checklist. Server
  action per repo convention (`actions.ts` next to the page).
- **Workout tagging** (Phase 3): optional "Where are you training?" on workout
  start/finish — a *suggestion chip* of the nearest gym (one tap) rather than a
  search-first flow; user is in the gym at that moment. Never block workout
  logging on it.

All data access goes through the existing layering: repository
(`src/lib/repositories/gyms.repository.ts`) → service (`src/lib/services`) →
server components / server actions.

## Phases & acceptance criteria

### Phase 1 — Map + OSM seed (MVP)
Schema (`gyms` + PostGIS + RPC), OSM import script (one region), map page with
nearest-gyms list, gym detail page (no reviews yet), OSM attribution.
✅ A logged-in user on a phone can open Gyms, grant location, see real nearby
park gyms on a map and as a sorted list, tap one, and get directions.

### Phase 2 — Community layer
Reviews/ratings, renown tiers with badges, add-a-gym flow with dedupe guard and
auto-verification, public-username function for reviews.
✅ A user can add a missing gym, see it as "Rumored Spot", review gyms, and see
tiers change with community feedback.

### Phase 3 — Identity layer
`workouts.gym_id`, tagging UI, gym leaderboards, Legend ranks, profile passport.
✅ A user who tags workouts at a gym climbs its ladder, appears on its
leaderboard, and their profile shows every gym they've trained at.

## Out of scope (for now)

- Gym photos (storage + moderation cost; revisit after Phase 2).
- Editing/flagging existing gyms, closure reports.
- Periodic OSM re-sync (import is one-shot + manual re-runs; `osm_id` keeps the
  door open).
- Offline map support.
- "Reigning Legend" competitive rank.

## Conventions reminder for the implementing agent

Read `CLAUDE.md` first — especially the **mobile-first rules** (375px-first, fixed
bottom nav overlay, safe-area insets, ≥44px touch targets, `inputMode` on numeric
inputs, no hover-only affordances, lazy-load heavy client libs). Verify every new
screen at 375px before finishing. Type-check with `npm run build` (there is no
separate typecheck script).
