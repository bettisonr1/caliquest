import type { SupabaseClient } from '@supabase/supabase-js'
import type { Exercise } from '@/types/database'

export async function getExercisesBySkillId(supabase: SupabaseClient, skillId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('skill_id', skillId)
  if (error) throw error
  return data as Exercise[]
}

export async function getExerciseById(supabase: SupabaseClient, exerciseId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle()
  if (error) throw error
  return data as Exercise | null
}

export async function getAllExercises(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Exercise[]
}
