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
  created_at     timestamptz not null default now()
);

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
alter table public.user_quests      enable row level security;
alter table public.skills           enable row level security;
alter table public.skill_prerequisites enable row level security;
alter table public.exercises        enable row level security;
alter table public.quests           enable row level security;

-- profiles
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- muscle_group_xp
create policy "Users can view own xp"   on public.muscle_group_xp for select using (auth.uid() = user_id);
create policy "Users can update own xp" on public.muscle_group_xp for update using (auth.uid() = user_id);

-- user_skills
create policy "Users can view own skills"   on public.user_skills for select using (auth.uid() = user_id);
create policy "Users can insert own skills" on public.user_skills for insert with check (auth.uid() = user_id);

-- workouts
create policy "Users can view own workouts"   on public.workouts for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on public.workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on public.workouts for update using (auth.uid() = user_id);

-- workout_sets
create policy "Users can view own sets"   on public.workout_sets for select using (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
);
create policy "Users can insert own sets" on public.workout_sets for insert with check (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
);

-- user_quests
create policy "Users can view own quests"   on public.user_quests for select using (auth.uid() = user_id);
create policy "Users can insert own quests" on public.user_quests for insert with check (auth.uid() = user_id);
create policy "Users can update own quests" on public.user_quests for update using (auth.uid() = user_id);

-- Public read for static content
create policy "Skills readable by authenticated users"             on public.skills             for select using (auth.role() = 'authenticated');
create policy "Prerequisites readable by authenticated users"      on public.skill_prerequisites for select using (auth.role() = 'authenticated');
create policy "Exercises readable by authenticated users"          on public.exercises          for select using (auth.role() = 'authenticated');
create policy "Quests readable by authenticated users"             on public.quests             for select using (auth.role() = 'authenticated');
