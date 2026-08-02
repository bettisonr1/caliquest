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
create policy "Quests readable by authenticated users"             on public.quests             for select using (auth.role() = 'authenticated');

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
