import type { SupabaseClient } from '@supabase/supabase-js'
import type { MuscleGroup, Quest, UserQuest, UserQuestWithQuest } from '@/types/database'

export async function createQuest(
  supabase: SupabaseClient,
  quest: {
    user_id: string
    title: string
    description: string
    target_muscle_group: MuscleGroup
    target_count: number
    xp_reward: number
    duration_days: number
    guru_name: string
    guru_persona: string
    guru_greeting: string
  }
) {
  const { data, error } = await supabase
    .from('quests')
    .insert({ ...quest, is_active: true })
    .select()
    .single()
  if (error) throw error
  return data as Quest
}

export async function getActiveGeneratedQuests(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
  return data as Quest[]
}

export async function deactivateQuest(supabase: SupabaseClient, userId: string, questId: string) {
  const { error } = await supabase
    .from('quests')
    .update({ is_active: false })
    .eq('id', questId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getUserQuestsWithQuest(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_quests')
    .select('*, quests(*)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as UserQuestWithQuest[]
}

export async function getUserQuestWithQuestById(
  supabase: SupabaseClient,
  userId: string,
  userQuestId: string
) {
  const { data, error } = await supabase
    .from('user_quests')
    .select('*, quests(*)')
    .eq('id', userQuestId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as UserQuestWithQuest | null
}

export async function insertUserQuest(
  supabase: SupabaseClient,
  userId: string,
  questId: string,
  expiresAt: string
) {
  const { data, error } = await supabase
    .from('user_quests')
    .insert({ user_id: userId, quest_id: questId, expires_at: expiresAt, status: 'active' })
    .select()
    .single()
  if (error) throw error
  return data as UserQuest
}

export async function updateUserQuestProgress(
  supabase: SupabaseClient,
  userQuestId: string,
  progress: number
) {
  const { error } = await supabase
    .from('user_quests')
    .update({ progress })
    .eq('id', userQuestId)
  if (error) throw error
}

export async function completeUserQuest(
  supabase: SupabaseClient,
  userQuestId: string,
  fields: { progress: number; bonus_xp: number }
) {
  const { error } = await supabase
    .from('user_quests')
    .update({ ...fields, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', userQuestId)
  if (error) throw error
}

export async function expireUserQuest(supabase: SupabaseClient, userQuestId: string) {
  const { error } = await supabase
    .from('user_quests')
    .update({ status: 'expired' })
    .eq('id', userQuestId)
  if (error) throw error
}
