import type { SupabaseClient } from '@supabase/supabase-js'
import type { MuscleGroup, Profile } from '@/types/database'

export async function getMuscleGroupXP(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('muscle_group_xp')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return Object.fromEntries(
    (data ?? []).map((r: { muscle_group: string; xp: number }) => [r.muscle_group, r.xp])
  ) as Record<MuscleGroup, number>
}

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data as Profile
}

export async function updateMuscleGroupXP(
  supabase: SupabaseClient,
  userId: string,
  muscleGroup: MuscleGroup,
  xp: number
) {
  const { error } = await supabase
    .from('muscle_group_xp')
    .update({ xp })
    .eq('user_id', userId)
    .eq('muscle_group', muscleGroup)
  if (error) throw error
}

export async function getProfilesByUserIds(supabase: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds)
  if (error) throw error
  return data as Profile[]
}

// Marks the profile as onboarded and applies the seeded XP in one conditional
// update. Returns false if the profile was already onboarded (the .is() filter
// matched no rows), which makes onboarding safe against double submission.
export async function claimOnboarding(
  supabase: SupabaseClient,
  userId: string,
  fields: { total_xp: number; level: number; onboarding_xp: number }
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...fields, onboarded_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('onboarded_at', null)
    .select('user_id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function updateProfileAfterWorkout(
  supabase: SupabaseClient,
  userId: string,
  fields: { total_xp: number; level: number; streak_days: number; last_workout_at: string }
) {
  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('user_id', userId)
  if (error) throw error
}
