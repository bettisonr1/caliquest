import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workout, WorkoutSet, WorkoutWithBumps } from '@/types/database'

export async function createWorkout(
  supabase: SupabaseClient,
  userId: string,
  options?: { totalXp?: number; notes?: string | null; gymId?: string | null }
) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      started_at: now,
      completed_at: now,
      total_xp: options?.totalXp ?? 0,
      notes: options?.notes ?? null,
      gym_id: options?.gymId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Workout
}

// Completed workouts, newest first, with sets, exercises and fist-bumps.
// RLS scopes visibility: callers can pass their own id or a friend's.
export async function getRecentCompletedWorkouts(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_sets(*, exercises(*)), workout_fistbumps(user_id)')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as WorkoutWithBumps[]
}

// Per-user completed-workout counts since a given timestamp, for the friends
// leaderboard. Relies on the workouts RLS policy (own + accepted friends) —
// callers must only pass ids the viewer is actually allowed to see.
export async function getCompletedWorkoutCountsSince(
  supabase: SupabaseClient,
  userIds: string[],
  sinceIso: string
) {
  if (userIds.length === 0) return new Map<string, number>()
  const { data, error } = await supabase
    .from('workouts')
    .select('user_id')
    .in('user_id', userIds)
    .not('completed_at', 'is', null)
    .gte('completed_at', sinceIso)
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as { user_id: string }[]) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1)
  }
  return counts
}

export async function countCompletedWorkouts(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
  if (error) throw error
  return count ?? 0
}

export async function getWorkoutById(supabase: SupabaseClient, workoutId: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .maybeSingle()
  if (error) throw error
  return data as Workout | null
}

export async function findFistbump(supabase: SupabaseClient, workoutId: string, userId: string) {
  const { data, error } = await supabase
    .from('workout_fistbumps')
    .select('workout_id')
    .eq('workout_id', workoutId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data !== null
}

export async function insertFistbump(supabase: SupabaseClient, workoutId: string, userId: string) {
  const { error } = await supabase
    .from('workout_fistbumps')
    .insert({ workout_id: workoutId, user_id: userId })
  // 23505 = already bumped (double tap / concurrent request) — treat as success
  if (error && error.code !== '23505') throw error
}

export async function deleteFistbump(supabase: SupabaseClient, workoutId: string, userId: string) {
  const { error } = await supabase
    .from('workout_fistbumps')
    .delete()
    .eq('workout_id', workoutId)
    .eq('user_id', userId)
  if (error) throw error
}

// Recent workouts with per-set XP and muscle group, for sizing quest targets
// from actual training volume.
export type WorkoutVolumeRow = {
  id: string
  started_at: string
  workout_sets: Array<{
    xp_earned: number
    exercises: { muscle_group: string } | null
  }>
}

export async function getWorkoutsSince(supabase: SupabaseClient, userId: string, sinceISO: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, started_at, workout_sets(xp_earned, exercises(muscle_group))')
    .eq('user_id', userId)
    .gte('started_at', sinceISO)
  if (error) throw error
  return (data ?? []) as unknown as WorkoutVolumeRow[]
}

export async function createWorkoutSets(
  supabase: SupabaseClient,
  sets: Array<{
    workout_id: string
    exercise_id: string
    reps: number | null
    duration_seconds: number | null
    xp_earned?: number
  }>
) {
  const { data, error } = await supabase
    .from('workout_sets')
    .insert(sets)
    .select()
  if (error) throw error
  return data as WorkoutSet[]
}
