import type { SupabaseClient } from '@supabase/supabase-js'
import type { Friendship, PublicProfile } from '@/types/database'

export async function findFriendshipBetween(supabase: SupabaseClient, userId: string, otherId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`
    )
    .maybeSingle()
  if (error) throw error
  return data as Friendship | null
}

export async function getFriendshipById(supabase: SupabaseClient, friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .maybeSingle()
  if (error) throw error
  return data as Friendship | null
}

export async function insertFriendRequest(supabase: SupabaseClient, requesterId: string, addresseeId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select()
    .single()
  if (error) throw error
  return data as Friendship
}

export async function acceptFriendRequest(supabase: SupabaseClient, friendshipId: string) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', friendshipId)
  if (error) throw error
}

export async function deleteFriendship(supabase: SupabaseClient, friendshipId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
  if (error) throw error
}

export async function getAcceptedFriendships(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')
  if (error) throw error
  return data as Friendship[]
}

export async function getIncomingRequests(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
  if (error) throw error
  return data as Friendship[]
}

export async function getOutgoingRequests(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('requester_id', userId)
    .eq('status', 'pending')
  if (error) throw error
  return data as Friendship[]
}

export async function searchProfilesByUsername(supabase: SupabaseClient, query: string) {
  const { data, error } = await supabase.rpc('search_profiles_by_username', { query })
  if (error) throw error
  return data as PublicProfile[]
}
