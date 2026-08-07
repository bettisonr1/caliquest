import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GymSuggestion,
  GymSuggestionField,
  GymSuggestionProposedValue,
  GymSuggestionVote,
  GymSuggestionVoteValue,
} from '@/types/database'

// Creates a pending suggestion and casts the suggester's own automatic
// approve vote, atomically (security-definer function — see schema.sql).
// Returns the new suggestion's id.
export async function proposeGymSuggestion(
  supabase: SupabaseClient,
  gymId: string,
  field: GymSuggestionField,
  proposedValue: GymSuggestionProposedValue
) {
  const { data, error } = await supabase.rpc('propose_gym_suggestion', {
    p_gym_id: gymId,
    p_field: field,
    p_proposed_value: proposedValue,
  })
  if (error) throw error
  return data as string
}

// Casts a vote and resolves the suggestion (applying the change + awarding
// points, or dropping it) in the same transaction if a threshold is crossed.
export async function castGymSuggestionVote(
  supabase: SupabaseClient,
  suggestionId: string,
  vote: GymSuggestionVoteValue
) {
  const { error } = await supabase.rpc('cast_gym_suggestion_vote', {
    p_suggestion_id: suggestionId,
    p_vote: vote,
  })
  if (error) throw error
}

export async function getPendingSuggestionsForGym(supabase: SupabaseClient, gymId: string) {
  const { data, error } = await supabase
    .from('gym_suggestions')
    .select('*')
    .eq('gym_id', gymId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as GymSuggestion[]
}

export async function getVotesForSuggestions(supabase: SupabaseClient, suggestionIds: string[]) {
  if (suggestionIds.length === 0) return []
  const { data, error } = await supabase
    .from('gym_suggestion_votes')
    .select('*')
    .in('suggestion_id', suggestionIds)
  if (error) throw error
  return (data ?? []) as GymSuggestionVote[]
}
