import type { SupabaseClient } from '@supabase/supabase-js'
import type { Skill, SkillPrerequisite } from '@/types/database'

export async function getAllSkills(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as Skill[]
}

export async function getSkillPrerequisites(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('skill_prerequisites')
    .select('*')
  if (error) throw error
  return data as SkillPrerequisite[]
}

export async function getUserUnlockedSkillIds(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_skills')
    .select('skill_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set((data ?? []).map((r: { skill_id: string }) => r.skill_id))
}

export async function getSkillById(supabase: SupabaseClient, skillId: string) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .maybeSingle()
  if (error) throw error
  return data as Skill | null
}

export async function insertUserSkill(supabase: SupabaseClient, userId: string, skillId: string) {
  const { error } = await supabase
    .from('user_skills')
    .insert({ user_id: userId, skill_id: skillId })
  if (error) throw error
}
