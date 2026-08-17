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
-- Admins can edit gym info directly, bypassing the community suggestion/vote
-- flow (see is_admin() and "Admins can update gyms" below). No granting UI
-- yet — set manually via `update public.profiles set is_admin = true where
-- user_id = '<uuid>'` in the Supabase SQL editor.
alter table public.profiles add column if not exists is_admin boolean not null default false;
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
  sort_order      integer not null default 0,
  -- Short, punchy cues for the skill detail page: what good form looks and
  -- feels like once you're in the position/rep. 3-5 per skill.
  form_cues       text[] not null default '{}'
);

-- Migration for databases created before the skill detail page existed
-- ("create table if not exists" above won't add new columns):
alter table public.skills add column if not exists form_cues text[] not null default '{}';

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

-- Admin check, used by RLS policies that let admins bypass the normal
-- community approval flow (e.g. direct gym edits below) — security definer
-- so it can read profiles regardless of the profiles select policy.
create or replace function public.is_admin(uid uuid) returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce((select is_admin from public.profiles where user_id = uid), false);
$$;

-- ============================================================
-- Gym Finder RLS
-- ============================================================
alter table public.gyms        enable row level security;
alter table public.gym_reviews enable row level security;

create policy "Gyms readable by authenticated users" on public.gyms
  for select using (auth.role() = 'authenticated');
create policy "Users can add gyms" on public.gyms
  for insert with check (auth.uid() = created_by);
-- No general update/delete policy — avoids vandalism; auto-verification
-- above updates status via a security definer trigger, not user writes.
-- Admins are the one exception: they can edit gym info (name, equipment)
-- directly, without going through the suggestion/vote flow below.
create policy "Admins can update gyms" on public.gyms
  for update using (public.is_admin(auth.uid()));

create policy "Gym reviews readable by authenticated users" on public.gym_reviews
  for select using (auth.role() = 'authenticated');
create policy "Users can add own gym review" on public.gym_reviews
  for insert with check (auth.uid() = user_id);
create policy "Users can update own gym review" on public.gym_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own gym review" on public.gym_reviews
  for delete using (auth.uid() = user_id);
-- Squads: groups of friends who train together. Each squad has
-- a wall (posts); leaders can post announcements that notify
-- every member via the notifications table.
-- ============================================================
create table if not exists public.squads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  gym_name     text,
  meeting_info text,
  created_by   uuid references public.profiles(user_id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.squad_members (
  squad_id   uuid references public.squads(id) on delete cascade,
  user_id    uuid references public.profiles(user_id) on delete cascade,
  role       text not null default 'member' check (role in ('leader','member')),
  status     text not null default 'invited' check (status in ('invited','active')),
  invited_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  joined_at  timestamptz,
  primary key (squad_id, user_id)
);

create table if not exists public.squad_posts (
  squad_id        uuid references public.squads(id) on delete cascade,
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references public.profiles(user_id) on delete cascade,
  content         text not null,
  is_announcement boolean not null default false,
  created_at      timestamptz not null default now()
);

-- In-app notifications. Rows are written only by security-definer triggers
-- (announcement fan-out, invites); message is denormalized display copy so
-- the bell renders from a single query.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(user_id) on delete cascade,
  type       text not null check (type in ('squad_announcement','squad_invite')),
  squad_id   uuid references public.squads(id) on delete cascade,
  post_id    uuid references public.squad_posts(id) on delete cascade,
  message    text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- Membership helpers: security definer (like are_friends) so RLS policies on
-- squads/squad_members/squad_posts can consult memberships without recursion.
create or replace function public.is_squad_member(squad uuid, uid uuid) returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.squad_members m
    where m.squad_id = squad and m.user_id = uid and m.status = 'active'
  );
$$;

create or replace function public.is_squad_leader(squad uuid, uid uuid) returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.squad_members m
    where m.squad_id = squad and m.user_id = uid and m.status = 'active' and m.role = 'leader'
  );
$$;

-- Any membership row, including a pending invite — lets invitees read the
-- squad's name before accepting.
create or replace function public.has_squad_membership(squad uuid, uid uuid) returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.squad_members m
    where m.squad_id = squad and m.user_id = uid
  );
$$;

revoke all on function public.is_squad_member(uuid, uuid) from public;
revoke all on function public.is_squad_leader(uuid, uuid) from public;
revoke all on function public.has_squad_membership(uuid, uuid) from public;
grant execute on function public.is_squad_member(uuid, uuid) to authenticated;
grant execute on function public.is_squad_leader(uuid, uuid) to authenticated;
grant execute on function public.has_squad_membership(uuid, uuid) to authenticated;

-- Creates a squad and its leader membership atomically (security definer
-- avoids a chicken-and-egg insert policy on squad_members).
create or replace function public.create_squad(
  squad_name text,
  squad_description text default null,
  squad_gym text default null,
  squad_meeting_info text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if squad_name is null or length(trim(squad_name)) = 0 then
    raise exception 'squad name required';
  end if;

  insert into public.squads (name, description, gym_name, meeting_info, created_by)
  values (
    trim(squad_name),
    nullif(trim(coalesce(squad_description, '')), ''),
    nullif(trim(coalesce(squad_gym, '')), ''),
    nullif(trim(coalesce(squad_meeting_info, '')), ''),
    auth.uid()
  )
  returning id into new_id;

  insert into public.squad_members (squad_id, user_id, role, status, invited_by, joined_at)
  values (new_id, auth.uid(), 'leader', 'active', auth.uid(), now());

  return new_id;
end;
$$;

revoke all on function public.create_squad(text, text, text, text) from public;
grant execute on function public.create_squad(text, text, text, text) to authenticated;

-- Notification fan-out: an announcement notifies every active member except
-- the author; a new invite notifies the invitee. Definer triggers mean no
-- client insert policy is needed on notifications.
create or replace function public.handle_squad_announcement() returns trigger as $$
begin
  if new.is_announcement then
    insert into public.notifications (user_id, type, squad_id, post_id, message)
    select
      m.user_id,
      'squad_announcement',
      new.squad_id,
      new.id,
      (select s.name from public.squads s where s.id = new.squad_id)
        || ': ' || left(new.content, 140)
    from public.squad_members m
    where m.squad_id = new.squad_id
      and m.status = 'active'
      and m.user_id <> new.author_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_squad_announcement on public.squad_posts;
create trigger on_squad_announcement
  after insert on public.squad_posts
  for each row execute procedure public.handle_squad_announcement();

create or replace function public.handle_squad_invite() returns trigger as $$
begin
  if new.status = 'invited' then
    insert into public.notifications (user_id, type, squad_id, message)
    values (
      new.user_id,
      'squad_invite',
      new.squad_id,
      'You''ve been invited to join '
        || (select s.name from public.squads s where s.id = new.squad_id)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_squad_invite on public.squad_members;
create trigger on_squad_invite
  after insert on public.squad_members
  for each row execute procedure public.handle_squad_invite();

-- Squads RLS
alter table public.squads        enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_posts   enable row level security;
alter table public.notifications enable row level security;

-- squads: visible to anyone with a membership row (invitees see the name);
-- editable by leaders; created only via the create_squad function.
create policy "Squads visible to members and invitees" on public.squads
  for select using (public.has_squad_membership(id, auth.uid()));
create policy "Leaders can update squad details" on public.squads
  for update using (public.is_squad_leader(id, auth.uid()))
  with check (public.is_squad_leader(id, auth.uid()));

-- squad_members: leaders invite their accepted friends as plain members;
-- invitees accept their own row (never changing role); self or leader removes.
create policy "Members can view squad membership" on public.squad_members
  for select using (auth.uid() = user_id or public.is_squad_member(squad_id, auth.uid()));
create policy "Leaders can invite friends" on public.squad_members
  for insert with check (
    public.is_squad_leader(squad_id, auth.uid())
    and public.are_friends(auth.uid(), user_id)
    and role = 'member'
    and status = 'invited'
    and invited_by = auth.uid()
  );
create policy "Invitees can accept their invite" on public.squad_members
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and role = 'member');
create policy "Self or leader can remove membership" on public.squad_members
  for delete using (auth.uid() = user_id or public.is_squad_leader(squad_id, auth.uid()));

-- squad_posts: members read and post; announcements are leader-only;
-- authors or leaders can delete.
create policy "Members can view squad posts" on public.squad_posts
  for select using (public.is_squad_member(squad_id, auth.uid()));
create policy "Members can post to the wall" on public.squad_posts
  for insert with check (
    auth.uid() = author_id
    and public.is_squad_member(squad_id, auth.uid())
    and (not is_announcement or public.is_squad_leader(squad_id, auth.uid()))
  );
create policy "Author or leader can delete a post" on public.squad_posts
  for delete using (auth.uid() = author_id or public.is_squad_leader(squad_id, auth.uid()));

-- notifications: recipients read and mark-read their own; writes happen only
-- through the definer triggers above.
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users can mark own notifications read" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Gym Community Suggestions + Contributor Points
-- Any authenticated user can propose a correction to an existing gym's
-- `name` or `equipment`; 10 community approvals accepts it, 10 rejections
-- drops it. Resolution (counting votes, applying the change, awarding
-- points) happens inside a single security-definer function so two
-- near-simultaneous votes can't both believe they're "the 10th" and double
-- apply the change or double-award points.
-- ============================================================
alter table public.profiles add column if not exists contributor_points integer not null default 0;
-- Fields a community suggestion has already overwritten on this gym, so a
-- future OSM re-import (scripts/import-osm-gyms.ts) knows to leave them
-- alone instead of silently reverting the community's edit.
alter table public.gyms add column if not exists community_edited_fields text[] not null default '{}';

create table if not exists public.gym_suggestions (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid references public.gyms(id) on delete cascade,
  field          text not null check (field in ('name', 'equipment')),
  -- Always {"value": ...} — a string for `name`, an equipment-shaped object
  -- for `equipment` (merged into the existing equipment jsonb on accept,
  -- not a full replace, so a correction doesn't silently drop unrelated
  -- equipment tags).
  proposed_value jsonb not null,
  suggested_by   uuid references public.profiles(user_id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);
create index if not exists gym_suggestions_gym_idx on public.gym_suggestions (gym_id);

create table if not exists public.gym_suggestion_votes (
  suggestion_id uuid references public.gym_suggestions(id) on delete cascade,
  user_id       uuid references public.profiles(user_id) on delete cascade,
  vote          text not null check (vote in ('approve', 'reject')),
  created_at    timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);

alter table public.gym_suggestions      enable row level security;
alter table public.gym_suggestion_votes enable row level security;

create policy "Suggestions readable by authenticated users" on public.gym_suggestions
  for select using (auth.role() = 'authenticated');
create policy "Votes readable by authenticated users" on public.gym_suggestion_votes
  for select using (auth.role() = 'authenticated');
-- No direct insert/update policies for either table beyond what the
-- functions below need — creation and voting both go through
-- security-definer functions so resolution stays atomic (see comment above).

-- Creates a pending suggestion and casts the suggester's own automatic
-- approve vote, atomically. One pending suggestion per (gym, field).
create or replace function public.propose_gym_suggestion(
  p_gym_id uuid, p_field text, p_proposed_value jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_field not in ('name', 'equipment') then
    raise exception 'INVALID_FIELD';
  end if;

  if exists (
    select 1 from public.gym_suggestions
    where gym_id = p_gym_id and field = p_field and status = 'pending'
  ) then
    raise exception 'SUGGESTION_ALREADY_PENDING';
  end if;

  insert into public.gym_suggestions (gym_id, field, proposed_value, suggested_by)
  values (p_gym_id, p_field, p_proposed_value, auth.uid())
  returning id into v_id;

  insert into public.gym_suggestion_votes (suggestion_id, user_id, vote)
  values (v_id, auth.uid(), 'approve');

  return v_id;
end;
$$;

-- Casts a vote and resolves the suggestion in the same transaction if a
-- threshold is crossed — this can't safely be split into two round-trips,
-- see the section comment above.
create or replace function public.cast_gym_suggestion_vote(p_suggestion_id uuid, p_vote text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_suggestion record;
  v_approvals int;
  v_rejections int;
  -- +5 contributor points per accepted suggestion — a starting number, no
  -- balance implications since points are display-only (see the matching
  -- CONTRIBUTOR_POINTS_PER_ACCEPTED_SUGGESTION constant in gyms.service.ts).
  v_points_per_accept constant int := 5;
  v_approve_threshold  constant int := 10;
  v_reject_threshold   constant int := 10;
begin
  if p_vote not in ('approve', 'reject') then raise exception 'INVALID_VOTE'; end if;

  select * into v_suggestion from public.gym_suggestions where id = p_suggestion_id for update;
  if not found or v_suggestion.status <> 'pending' then raise exception 'SUGGESTION_NOT_PENDING'; end if;

  insert into public.gym_suggestion_votes (suggestion_id, user_id, vote)
  values (p_suggestion_id, auth.uid(), p_vote);

  select count(*) filter (where vote = 'approve'), count(*) filter (where vote = 'reject')
    into v_approvals, v_rejections
    from public.gym_suggestion_votes where suggestion_id = p_suggestion_id;

  if v_approvals >= v_approve_threshold then
    if v_suggestion.field = 'name' then
      update public.gyms
        set name = v_suggestion.proposed_value->>'value',
            community_edited_fields = case
              when 'name' = any(community_edited_fields) then community_edited_fields
              else array_append(community_edited_fields, 'name')
            end
        where id = v_suggestion.gym_id;
    elsif v_suggestion.field = 'equipment' then
      update public.gyms
        set equipment = equipment || (v_suggestion.proposed_value->'value'),
            community_edited_fields = case
              when 'equipment' = any(community_edited_fields) then community_edited_fields
              else array_append(community_edited_fields, 'equipment')
            end
        where id = v_suggestion.gym_id;
    end if;

    -- Strictly additive — never deducted on rejection. Kept as its own
    -- column on profiles, a sibling of total_xp, not merged into it: XP is
    -- physical training, this is a different axis of progression.
    update public.profiles set contributor_points = contributor_points + v_points_per_accept
      where user_id = v_suggestion.suggested_by;

    update public.gym_suggestions set status = 'accepted', resolved_at = now()
      where id = p_suggestion_id;
  elsif v_rejections >= v_reject_threshold then
    update public.gym_suggestions set status = 'rejected', resolved_at = now()
      where id = p_suggestion_id;
  end if;
end;
$$;

revoke all on function public.propose_gym_suggestion(uuid, text, jsonb) from public;
revoke all on function public.cast_gym_suggestion_vote(uuid, text) from public;
grant execute on function public.propose_gym_suggestion(uuid, text, jsonb) to authenticated;
grant execute on function public.cast_gym_suggestion_vote(uuid, text) to authenticated;

-- ============================================================
-- Competitions
-- Events tied to a gym. Users register to compete or mark
-- themselves as attending to support. See
-- competitions-feature-design.md for the full design writeup.
-- ============================================================
create table if not exists public.competitions (
  id                         uuid primary key default gen_random_uuid(),
  gym_id                     uuid not null references public.gyms(id) on delete cascade,
  name                       text not null,
  description                text,
  image_url                  text,
  start_at                   timestamptz not null,
  end_at                     timestamptz,                 -- nullable: multi-day events
  registration_deadline      timestamptz,
  skill_level                text not null default 'open'
                               check (skill_level in ('open','beginner','intermediate','advanced')),
  entry_fee_minor_units      integer,                      -- null/0 = free; minor unit of `currency`
  currency                   text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),  -- ISO 4217
  capacity                   integer,                      -- null = unlimited; applies to 'competing' intent only
  external_registration_url  text,                         -- third-party signup, if any
  status                     text not null default 'published' check (status in ('published','cancelled')),
  created_by                 uuid references public.profiles(user_id) on delete set null,
  created_at                 timestamptz not null default now()
);
create index if not exists competitions_gym_idx on public.competitions (gym_id);
create index if not exists competitions_upcoming_idx on public.competitions (start_at)
  where status = 'published';

-- One row per (competition, user); `intent` is upserted in place when a
-- user switches between competing/attending. No `status` column here —
-- confirmed-vs-waitlisted is computed by competition_participant_status
-- below rather than stored (see that function's comment).
create table if not exists public.competition_participants (
  competition_id uuid references public.competitions(id) on delete cascade,
  user_id        uuid references public.profiles(user_id) on delete cascade,
  intent         text not null check (intent in ('competing','attending')),
  created_at     timestamptz not null default now(),
  primary key (competition_id, user_id)
);

-- ------------------------------------------------------------
-- Nearby competitions RPC — mirrors gyms_near, joined through the
-- competition's gym for its location (competitions have no lat/lng of
-- their own). Ordered by start_at (soonest first), not distance:
-- "what's on soon nearby" beats "what's nearby regardless of when"
-- for an events feed, unlike gyms_near where closest is the whole point.
-- ------------------------------------------------------------
create or replace function public.competitions_near(
  lat double precision,
  lng double precision,
  radius_m integer default 100000,   -- wider than gyms_near's 25km — competitions are sparser
  max_results integer default 50
)
returns table (
  id         uuid,
  name       text,
  image_url  text,
  start_at   timestamptz,
  gym_id     uuid,
  gym_name   text,
  lat        double precision,
  lng        double precision,
  distance_m double precision
)
language sql
stable
as $$
  select
    c.id, c.name, c.image_url, c.start_at,
    g.id, g.name,
    st_y(g.location::geometry) as lat,
    st_x(g.location::geometry) as lng,
    st_distance(g.location, st_makepoint(lng, lat)::geography) as distance_m
  from public.competitions c
  join public.gyms g on g.id = c.gym_id
  where c.status = 'published'
    and c.start_at >= now()
    and st_dwithin(g.location, st_makepoint(lng, lat)::geography, radius_m)
  order by c.start_at asc
  limit max_results;
$$;

revoke all on function public.competitions_near(double precision, double precision, integer, integer) from public;
grant execute on function public.competitions_near(double precision, double precision, integer, integer) to authenticated;

-- Name search (manual browse / geolocation-denied fallback) — same shape
-- as competitions_near minus distance.
create or replace function public.competitions_search_by_name(query text, max_results integer default 20)
returns table (
  id        uuid,
  name      text,
  image_url text,
  start_at  timestamptz,
  gym_id    uuid,
  gym_name  text,
  lat       double precision,
  lng       double precision
)
language sql
stable
as $$
  select
    c.id, c.name, c.image_url, c.start_at,
    g.id, g.name,
    st_y(g.location::geometry) as lat,
    st_x(g.location::geometry) as lng
  from public.competitions c
  join public.gyms g on g.id = c.gym_id
  where c.status = 'published'
    and c.start_at >= now()
    and c.name ilike '%' || query || '%'
  order by c.start_at asc
  limit max_results;
$$;

revoke all on function public.competitions_search_by_name(text, integer) from public;
grant execute on function public.competitions_search_by_name(text, integer) to authenticated;

-- Competitions with an upcoming date at a given gym, for the gym detail
-- page's "Upcoming Competitions" card.
create or replace function public.competitions_for_gym(target_gym_id uuid, max_results integer default 20)
returns table (
  id        uuid,
  name      text,
  image_url text,
  start_at  timestamptz
)
language sql
stable
as $$
  select c.id, c.name, c.image_url, c.start_at
  from public.competitions c
  where c.gym_id = target_gym_id
    and c.status = 'published'
    and c.start_at >= now()
  order by c.start_at asc
  limit max_results;
$$;

revoke all on function public.competitions_for_gym(uuid, integer) from public;
grant execute on function public.competitions_for_gym(uuid, integer) to authenticated;

-- ------------------------------------------------------------
-- Participant status — confirmed vs. waitlisted is computed here, not
-- stored: rank each intent's signups by created_at and compare the
-- 'competing' rank to the competition's capacity. Registering past
-- capacity is never rejected, it just ranks as waitlisted; a cancellation
-- frees up a rank and promotes the next person on the very next read —
-- no promote-the-next-waitlisted-person trigger required. Raising
-- capacity later needs no backfill either. See competitions-feature-
-- design.md's "Waitlisting" section for the full rationale.
-- ------------------------------------------------------------
-- Column named queue_position, not position — `position` is a reserved
-- SQL keyword (the POSITION(... IN ...) syntax) and can't be used
-- unquoted as a column name in a `returns table (...)` list.
create or replace function public.competition_participant_status(target_competition_id uuid)
returns table (
  user_id        uuid,
  intent         text,
  queue_position integer,
  waitlisted     boolean
)
language sql
stable
as $$
  with ranked as (
    select
      p.user_id,
      p.intent,
      row_number() over (partition by p.intent order by p.created_at) as queue_position
    from public.competition_participants p
    where p.competition_id = target_competition_id
  )
  select
    r.user_id,
    r.intent,
    r.queue_position,
    (r.intent = 'competing' and c.capacity is not null and r.queue_position > c.capacity) as waitlisted
  from ranked r
  cross join public.competitions c
  where c.id = target_competition_id;
$$;

revoke all on function public.competition_participant_status(uuid) from public;
grant execute on function public.competition_participant_status(uuid) to authenticated;

-- ============================================================
-- Competitions RLS
-- Same shape as gyms: readable by any authenticated user, writes gated
-- by ownership, admin bypass via the existing is_admin(). No moderation
-- queue — trust model matches squads, not the gyms community-suggestion
-- flow (see competitions-feature-design.md).
-- ============================================================
alter table public.competitions             enable row level security;
alter table public.competition_participants enable row level security;

create policy "Competitions readable by authenticated users" on public.competitions
  for select using (auth.role() = 'authenticated');
create policy "Users can create competitions" on public.competitions
  for insert with check (auth.uid() = created_by);
create policy "Creator or admin can update competition" on public.competitions
  for update using (auth.uid() = created_by or public.is_admin(auth.uid()));

-- Participant rows are publicly readable (not just to the competition
-- creator) so counts and "who's going" lists render for anyone — same
-- trust level as gym_reviews and the gym leaderboard.
create policy "Participants readable by authenticated users" on public.competition_participants
  for select using (auth.role() = 'authenticated');
create policy "Users manage own participation" on public.competition_participants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Competition images — first Storage-backed feature in the app. Public
-- read; write scoped to the uploader's own folder ({user_id}/...) so one
-- user can't overwrite another's file. RLS is already enabled on
-- storage.objects by Supabase itself, so no alter table needed here.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('competition-images', 'competition-images', true)
on conflict (id) do nothing;

create policy "Competition images are publicly readable" on storage.objects
  for select using (bucket_id = 'competition-images');
create policy "Users can upload their own competition images" on storage.objects
  for insert with check (
    bucket_id = 'competition-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can replace their own competition images" on storage.objects
  for update using (
    bucket_id = 'competition-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can delete their own competition images" on storage.objects
  for delete using (
    bucket_id = 'competition-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
