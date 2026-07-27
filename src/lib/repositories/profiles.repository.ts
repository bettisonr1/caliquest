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
