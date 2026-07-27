import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workout, WorkoutSet } from '@/types/database'

export async function createWorkout(supabase: SupabaseClient, userId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, started_at: now, completed_at: now })
    .select()
    .single()
  if (error) throw error
  return data as Workout
}

export async function createWorkoutSets(
  supabase: SupabaseClient,
  sets: Array<{
    workout_id: string
    exercise_id: string
    reps: number | null
    duration_seconds: number | null
  }>
) {
  const { data, error } = await supabase
    .from('workout_sets')
    .insert(sets)
    .select()
  if (error) throw error
  return data as WorkoutSet[]
}
