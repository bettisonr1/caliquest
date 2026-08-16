import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Competition,
  CompetitionIntent,
  CompetitionParticipant,
  CompetitionParticipantStatus,
  CompetitionSearchResult,
  NearbyCompetition,
  UpcomingCompetitionAtGym,
} from '@/types/database'

export async function getNearbyCompetitions(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  radiusM = 100000,
  maxResults = 50
) {
  const { data, error } = await supabase.rpc('competitions_near', {
    lat,
    lng,
    radius_m: radiusM,
    max_results: maxResults,
  })
  if (error) throw error
  return (data ?? []) as NearbyCompetition[]
}

export async function searchCompetitionsByName(supabase: SupabaseClient, query: string) {
  const { data, error } = await supabase.rpc('competitions_search_by_name', { query, max_results: 20 })
  if (error) throw error
  return (data ?? []) as CompetitionSearchResult[]
}

export async function getCompetitionsForGym(supabase: SupabaseClient, gymId: string) {
  const { data, error } = await supabase.rpc('competitions_for_gym', { target_gym_id: gymId, max_results: 20 })
  if (error) throw error
  return (data ?? []) as UpcomingCompetitionAtGym[]
}

export async function getCompetitionById(supabase: SupabaseClient, competitionId: string) {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .maybeSingle()
  if (error) throw error
  return data as Competition | null
}

export async function getCompetitionsByIds(supabase: SupabaseClient, competitionIds: string[]) {
  if (competitionIds.length === 0) return []
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .in('id', competitionIds)
  if (error) throw error
  return (data ?? []) as Competition[]
}

export async function insertCompetition(
  supabase: SupabaseClient,
  competition: {
    gym_id: string
    name: string
    description: string | null
    image_url: string | null
    start_at: string
    end_at: string | null
    registration_deadline: string | null
    skill_level: string
    entry_fee_minor_units: number | null
    currency: string
    capacity: number | null
    external_registration_url: string | null
    created_by: string
  }
) {
  const { data, error } = await supabase
    .from('competitions')
    .insert(competition)
    .select()
    .single()
  if (error) throw error
  return data as Competition
}

// Creator/admin only — enforced by the "Creator or admin can update
// competition" RLS policy, not this function.
export async function cancelCompetition(supabase: SupabaseClient, competitionId: string) {
  const { data, error } = await supabase
    .from('competitions')
    .update({ status: 'cancelled' })
    .eq('id', competitionId)
    .select()
    .single()
  if (error) throw error
  return data as Competition
}

export async function getCompetitionParticipantStatus(supabase: SupabaseClient, competitionId: string) {
  const { data, error } = await supabase.rpc('competition_participant_status', {
    target_competition_id: competitionId,
  })
  if (error) throw error
  return (data ?? []) as CompetitionParticipantStatus[]
}

// One row per (competition, user) — swaps `intent` in place if the user
// already had a row (e.g. switching from attending to competing).
export async function upsertParticipant(
  supabase: SupabaseClient,
  participant: { competition_id: string; user_id: string; intent: CompetitionIntent }
) {
  const { data, error } = await supabase
    .from('competition_participants')
    .upsert(participant, { onConflict: 'competition_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return data as CompetitionParticipant
}

export async function deleteParticipant(supabase: SupabaseClient, competitionId: string, userId: string) {
  const { error } = await supabase
    .from('competition_participants')
    .delete()
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
  if (error) throw error
}

// A user's own participation rows across all competitions, for the "Mine"
// tab on the competitions home page (id + intent is all it needs — full
// waitlist ranking there would mean one RPC call per competition).
export async function getParticipantRowsForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('competition_participants')
    .select('competition_id, intent')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as { competition_id: string; intent: CompetitionIntent }[]
}
