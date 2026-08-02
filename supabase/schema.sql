-- ============================================================
-- CaliQuest Schema
-- Run this in the Supabase SQL editor before seed.sql
-- ============================================================

-- Extends Supabase auth.users
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users on delete cascade,
  username       text unique not null,
  avatar_url     text,
  total_xp       integer not null default 0,
  level          integer not null default 1,
  prestige_tier  text not null default 'Novice',
  streak_days    integer not null default 0,
  last_workout_at timestamptz,
  -- First-login placement: when the user completed onboarding, and how much
  -- XP was seeded from their claimed skills (so "earned XP" can be derived
  -- later as total_xp - onboarding_xp).
  onboarded_at   timestamptz,
  onboarding_xp  integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Migration for databases created before onboarding existed
-- ("create table if not exists" above won't add new columns):
alter table public.profiles add column if not exists onboarded_at  timestamptz;
alter table public.profiles add column if not exists onboarding_xp integer not null default 0;
-- Optional: mark accounts that pre-date onboarding as already onboarded so
-- they aren't sent through the placement flow:
-- update public.profiles set onboarded_at = now() where onboarded_at is null and total_xp > 0;

-- XP per muscle group per user
create table if not exists public.muscle_group_xp (
  user_id       uuid references public.profiles(user_id) on delete cascade,
  muscle_group  text not null check (muscle_group in ('push','pull','core','legs','mobility')),
  xp            integer not null default 0,
  primary key (user_id, muscle_group)
);

-- Skill tree nodes
create table if not exists public.skills (
  id              uuid primary key,
  name            text not null,
  description     text,
  muscle_group    text not null check (muscle_group in ('push','pull','core','legs','mobility')),
  difficulty      text not null check (difficulty in ('beginner','intermediate','advanced','elite')),
  required_mg_xp  integer not null default 0,
  sort_order      integer not null default 0
);

-- Prerequisite edges (many-to-many)
create table if not exists public.skill_prerequisites (
  skill_id              uuid references public.skills(id) on delete cascade,
  prerequisite_skill_id uuid references public.skills(id) on delete cascade,
  primary key (skill_id, prerequisite_skill_id)
);

-- Skills unlocked by a user
create table if not exists public.user_skills (
  user_id      uuid references public.profiles(user_id) on delete cascade,
  skill_id     uuid references public.skills(id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, skill_id)
);

-- Exercise library
create table if not exists public.exercises (
  id                    uuid primary key,
  name                  text not null,
  description           text,
  muscle_group          text not null check (muscle_group in ('push','pull','core','legs','mobility')),
  difficulty_multiplier integer not null default 1 check (difficulty_multiplier between 1 and 4),
  skill_id              uuid references public.skills(id),
  type                  text not null default 'reps' check (type in ('reps','duration'))
);

-- Workout sessions
create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(user_id) on delete cascade,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  total_xp     integer not null default 0,
  notes        text
);

-- Sets within a workout
create table if not exists public.workout_sets (
  id                uuid primary key default gen_random_uuid(),
  workout_id        uuid references public.workouts(id) on delete cascade,
  exercise_id       uuid references public.exercises(id),
  reps              integer,
  duration_seconds  integer,
  xp_earned         integer not null default 0
);

-- Quest definitions (static content, seeded)
create table if not exists public.quests (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  target_exercise_id  uuid references public.exercises(id),
  target_muscle_group text check (target_muscle_group in ('push','pull','core','legs','mobility')),
  target_count        integer not null,
  xp_reward           integer not null,
  duration_days       integer not null,
  is_active           boolean not null default true
);

-- Quests accepted / completed by users
create table if not exists public.user_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(user_id) on delete cascade,
  quest_id     uuid references public.quests(id),
  progress     integer not null default 0,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- Fist-bumps: a friend's one-tap sign of respect on a workout.
-- One per (workout, friend); deleting the row un-bumps.
create table if not exists public.workout_fistbumps (
  workout_id  uuid references public.workouts(id) on delete cascade,
  user_id     uuid references public.profiles(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (workout_id, user_id)
);
-- Migration: dynamic per-user quests with an AI guru.
-- A quest row with user_id set is generated for that user (targeting their
-- weakest muscle group); user_id null is reserved for static/global quests.
-- target_count is measured in base XP earned in the target muscle group while
-- the quest is active; xp_reward is the completion bonus (0.5 × target, so
-- qualifying work effectively pays 1.5× — but only if the quest completes).
alter table public.quests add column if not exists user_id       uuid references public.profiles(user_id) on delete cascade;
alter table public.quests add column if not exists guru_name     text;
alter table public.quests add column if not exists guru_persona  text;
alter table public.quests add column if not exists guru_greeting text;

alter table public.user_quests add column if not exists expires_at timestamptz;
alter table public.user_quests add column if not exists bonus_xp   integer not null default 0;
alter table public.user_quests add column if not exists status     text not null default 'active'
  check (status in ('active','completed','expired'));

-- Friend connections (request/accept model)
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references public.profiles(user_id) on delete cascade,
  addressee_id  uuid references public.profiles(user_id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','accepted')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

-- ============================================================
-- Level calculation function (exponential curve, ×1.5 per level)
-- ============================================================
create or replace function public.xp_to_level(xp integer) returns integer as $$
declare
  lvl       integer := 1;
  threshold integer := 500;
  remaining integer := xp;
begin
  while remaining >= threshold loop
    remaining  := remaining - threshold;
    lvl        := lvl + 1;
    threshold  := (threshold * 15) / 10;
  end loop;
  return lvl;
end;
$$ language plpgsql immutable;

-- ============================================================
-- Auto-create profile + muscle_group_xp rows on signup
-- ============================================================
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (user_id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));

  insert into public.muscle_group_xp (user_id, muscle_group, xp) values
    (new.id, 'push',     0),
    (new.id, 'pull',     0),
    (new.id, 'core',     0),
    (new.id, 'legs',     0),
    (new.id, 'mobility', 0);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.muscle_group_xp  enable row level security;
alter table public.user_skills      enable row level security;
alter table public.workouts         enable row level security;
alter table public.workout_sets     enable row level security;
alter table public.workout_fistbumps enable row level security;
alter table public.user_quests      enable row level security;
alter table public.friendships      enable row level security;
alter table public.skills           enable row level security;
alter table public.skill_prerequisites enable row level security;
alter table public.exercises        enable row level security;
alter table public.quests           enable row level security;

-- profiles
-- Readable by the owner, or by anyone who has any friendship row (pending or
-- accepted) with them — this is what lets a friend request list, and a
-- friends list, render real usernames without opening profiles up globally.
create policy "Users can view own or connected profiles" on public.profiles
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where f.status in ('pending','accepted')
        and ((f.requester_id = auth.uid() and f.addressee_id = profiles.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = profiles.user_id))
    )
  );
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- muscle_group_xp
create policy "Users can view own xp"   on public.muscle_group_xp for select using (auth.uid() = user_id);
create policy "Users can update own xp" on public.muscle_group_xp for update using (auth.uid() = user_id);

-- user_skills
create policy "Users can view own skills"   on public.user_skills for select using (auth.uid() = user_id);
create policy "Users can insert own skills" on public.user_skills for insert with check (auth.uid() = user_id);

-- True when the two users have an accepted friendship in either direction.
-- security definer so it can be used inside RLS policies on other tables
-- without being blocked by friendships' own RLS.
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- workouts
-- Readable by the owner and by accepted friends, so a friend's profile can
-- show their recent workouts. Writes remain owner-only.
drop policy if exists "Users can view own workouts" on public.workouts;
drop policy if exists "Users can view own or friends' workouts" on public.workouts;
create policy "Users can view own or friends' workouts" on public.workouts
  for select using (
    auth.uid() = user_id or public.are_friends(auth.uid(), user_id)
  );
create policy "Users can insert own workouts" on public.workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on public.workouts for update using (auth.uid() = user_id);

-- workout_sets (visibility follows the parent workout)
drop policy if exists "Users can view own sets" on public.workout_sets;
drop policy if exists "Users can view sets of visible workouts" on public.workout_sets;
create policy "Users can view sets of visible workouts" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and (w.user_id = auth.uid() or public.are_friends(auth.uid(), w.user_id))
    )
  );
create policy "Users can insert own sets" on public.workout_sets for insert with check (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
);

-- workout_fistbumps
-- Anyone who can see a workout can see its fist-bumps; only accepted friends
-- of the workout's owner can add one (never on their own workout), and a
-- fist-bump can only be removed by the friend who gave it.
create policy "Users can view fistbumps on visible workouts" on public.workout_fistbumps
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and (w.user_id = auth.uid() or public.are_friends(auth.uid(), w.user_id))
    )
  );
create policy "Friends can fistbump a workout" on public.workout_fistbumps
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and w.user_id <> auth.uid()
        and public.are_friends(auth.uid(), w.user_id)
    )
  );
create policy "Users can remove their own fistbump" on public.workout_fistbumps
  for delete using (auth.uid() = user_id);

-- user_quests
create policy "Users can view own quests"   on public.user_quests for select using (auth.uid() = user_id);
create policy "Users can insert own quests" on public.user_quests for insert with check (auth.uid() = user_id);
create policy "Users can update own quests" on public.user_quests for update using (auth.uid() = user_id);

-- Public read for static content
create policy "Skills readable by authenticated users"             on public.skills             for select using (auth.role() = 'authenticated');
create policy "Prerequisites readable by authenticated users"      on public.skill_prerequisites for select using (auth.role() = 'authenticated');
create policy "Exercises readable by authenticated users"          on public.exercises          for select using (auth.role() = 'authenticated');
-- Quests: global quests (user_id null) are readable by everyone; generated
-- quests only by their owner, who can also create and update (decline) them.
drop policy if exists "Quests readable by authenticated users" on public.quests;
create policy "Quests readable by owner or global" on public.quests
  for select using (auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid()));
create policy "Users can insert own quests" on public.quests
  for insert with check (auth.uid() = user_id);
create policy "Users can update own quests" on public.quests
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friendships
create policy "Users can view their own friendships" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on public.friendships
  for insert with check (auth.uid() = requester_id);
create policy "Addressee can accept a request" on public.friendships
  for update using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);
create policy "Either party can delete a friendship" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============================================================
-- Username search (minimal public fields, bypasses profiles RLS
-- via security definer — used to find a stranger before any
-- friendships row exists between the two users)
-- ============================================================
create or replace function public.search_profiles_by_username(query text)
returns table (user_id uuid, username text, avatar_url text)
language sql
security definer
set search_path = public
as $$
  select user_id, username, avatar_url
  from public.profiles
  where username ilike '%' || query || '%'
    and user_id <> auth.uid()
  order by username
  limit 20;
$$;

revoke all on function public.search_profiles_by_username(text) from public;
grant execute on function public.search_profiles_by_username(text) to authenticated;

-- ============================================================
-- Gym Finder
-- Phase 1: gyms + PostGIS + nearest-gyms RPC
-- Phase 2: gym_reviews, auto-verification
-- Phase 3: workouts.gym_id, gym leaderboard RPC
-- ============================================================
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

-- Phase 3: workouts can be tagged to the gym they were trained at.
alter table public.workouts add column if not exists gym_id uuid references public.gyms(id);
create index if not exists workouts_gym_idx on public.workouts (gym_id) where gym_id is not null;

-- ------------------------------------------------------------
-- Nearest-gyms RPC: runs as invoker so gyms' own select RLS
-- applies; distance/coords are computed here so the client never
-- parses PostGIS geography types.
-- ------------------------------------------------------------
create or replace function public.gyms_near(
  lat double precision,
  lng double precision,
  radius_m integer default 25000,
  max_results integer default 50
)
returns table (
  id          uuid,
  name        text,
  lat         double precision,
  lng         double precision,
  distance_m  double precision,
  status      text,
  equipment   jsonb
)
language sql
stable
as $$
  select
    g.id,
    g.name,
    st_y(g.location::geometry) as lat,
    st_x(g.location::geometry) as lng,
    st_distance(g.location, st_makepoint(lng, lat)::geography) as distance_m,
    g.status,
    g.equipment
  from public.gyms g
  where st_dwithin(g.location, st_makepoint(lng, lat)::geography, radius_m)
  order by distance_m
  limit max_results;
$$;

revoke all on function public.gyms_near(double precision, double precision, integer, integer) from public;
grant execute on function public.gyms_near(double precision, double precision, integer, integer) to authenticated;

-- Name search (manual browse / geolocation-denied fallback) — same output
-- shape as gyms_near minus distance, so the client never parses geography.
create or replace function public.gyms_search_by_name(query text, max_results integer default 20)
returns table (
  id        uuid,
  name      text,
  lat       double precision,
  lng       double precision,
  status    text,
  equipment jsonb
)
language sql
stable
as $$
  select
    g.id,
    g.name,
    st_y(g.location::geometry) as lat,
    st_x(g.location::geometry) as lng,
    g.status,
    g.equipment
  from public.gyms g
  where g.name ilike '%' || query || '%'
  order by g.name
  limit max_results;
$$;

revoke all on function public.gyms_search_by_name(text, integer) from public;
grant execute on function public.gyms_search_by_name(text, integer) to authenticated;

-- A single gym's coordinates (for the detail page's Directions link) —
-- location is a PostGIS geography and isn't otherwise scalar-readable.
create or replace function public.gym_coordinates(target_gym_id uuid)
returns table (lat double precision, lng double precision)
language sql
stable
as $$
  select st_y(location::geometry) as lat, st_x(location::geometry) as lng
  from public.gyms
  where id = target_gym_id;
$$;

revoke all on function public.gym_coordinates(uuid) from public;
grant execute on function public.gym_coordinates(uuid) to authenticated;

-- ------------------------------------------------------------
-- Auto-verification: promote a gym from 'unverified' to 'verified'
-- once at least 2 users other than its creator have logged a
-- workout or review there. Security definer so it can update the
-- gyms row regardless of who triggers it (gyms has no user update
-- policy in v1) and read workouts across users for the count.
-- ------------------------------------------------------------
create or replace function public.maybe_verify_gym() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_gym_id uuid := new.gym_id;
  gym_creator   uuid;
  other_users   integer;
begin
  if target_gym_id is null then
    return new;
  end if;

  select created_by into gym_creator from public.gyms where id = target_gym_id;

  select count(distinct activity.user_id) into other_users
  from (
    select user_id from public.gym_reviews where gym_id = target_gym_id
    union
    select user_id from public.workouts where gym_id = target_gym_id and completed_at is not null
  ) activity
  where gym_creator is null or activity.user_id <> gym_creator;

  if other_users >= 2 then
    update public.gyms set status = 'verified' where id = target_gym_id and status = 'unverified';
  end if;

  return new;
end;
$$;

drop trigger if exists gym_reviews_verify on public.gym_reviews;
create trigger gym_reviews_verify
  after insert on public.gym_reviews
  for each row execute procedure public.maybe_verify_gym();

drop trigger if exists workouts_gym_verify on public.workouts;
create trigger workouts_gym_verify
  after insert or update of gym_id, completed_at on public.workouts
  for each row when (new.gym_id is not null)
  execute procedure public.maybe_verify_gym();

-- ------------------------------------------------------------
-- Gym leaderboard RPC: per-gym workout counts by user. Security
-- definer because workouts' own RLS only exposes a row to its
-- owner or accepted friends — a gym leaderboard needs counts
-- across strangers too, so this returns only the aggregate.
-- ------------------------------------------------------------
create or replace function public.gym_leaderboard(target_gym_id uuid, max_results integer default 20)
returns table (user_id uuid, workout_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select user_id, count(*)::bigint as workout_count
  from public.workouts
  where gym_id = target_gym_id
    and completed_at is not null
  group by user_id
  order by workout_count desc, user_id
  limit max_results;
$$;

revoke all on function public.gym_leaderboard(uuid, integer) from public;
grant execute on function public.gym_leaderboard(uuid, integer) to authenticated;

-- ------------------------------------------------------------
-- Public usernames for gym reviews & leaderboards (strangers'
-- profiles aren't otherwise visible — see "profiles" policy above).
-- ------------------------------------------------------------
create or replace function public.get_public_profiles(ids uuid[])
returns table (user_id uuid, username text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select user_id, username, avatar_url
  from public.profiles
  where user_id = any(ids);
$$;

revoke all on function public.get_public_profiles(uuid[]) from public;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;

-- ============================================================
-- Gym Finder RLS
-- ============================================================
alter table public.gyms        enable row level security;
alter table public.gym_reviews enable row level security;

create policy "Gyms readable by authenticated users" on public.gyms
  for select using (auth.role() = 'authenticated');
create policy "Users can add gyms" on public.gyms
  for insert with check (auth.uid() = created_by);
-- No update/delete policy in v1 — avoids vandalism; auto-verification
-- above updates status via a security definer trigger, not user writes.

create policy "Gym reviews readable by authenticated users" on public.gym_reviews
  for select using (auth.role() = 'authenticated');
create policy "Users can add own gym review" on public.gym_reviews
  for insert with check (auth.uid() = user_id);
create policy "Users can update own gym review" on public.gym_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own gym review" on public.gym_reviews
  for delete using (auth.uid() = user_id);
