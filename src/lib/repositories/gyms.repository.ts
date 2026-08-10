import type { SupabaseClient } from '@supabase/supabase-js'
import type { Gym, GymEquipment, GymReview, GymSearchResult, NearbyGym, PublicProfile } from '@/types/database'

export async function getNearbyGyms(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  radiusM = 25000,
  maxResults = 50
) {
  const { data, error } = await supabase.rpc('gyms_near', {
    lat,
    lng,
    radius_m: radiusM,
    max_results: maxResults,
  })
  if (error) throw error
  return (data ?? []) as NearbyGym[]
}

export async function getGymById(supabase: SupabaseClient, gymId: string) {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', gymId)
    .maybeSingle()
  if (error) throw error
  return data as Gym | null
}

export async function getGymCoordinates(supabase: SupabaseClient, gymId: string) {
  const { data, error } = await supabase.rpc('gym_coordinates', { target_gym_id: gymId })
  if (error) throw error
  const row = (data ?? [])[0] as { lat: number; lng: number } | undefined
  return row ?? null
}

export async function getGymsByIds(supabase: SupabaseClient, gymIds: string[]) {
  if (gymIds.length === 0) return []
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .in('id', gymIds)
  if (error) throw error
  return data as Gym[]
}

export async function searchGymsByName(supabase: SupabaseClient, query: string) {
  const { data, error } = await supabase.rpc('gyms_search_by_name', { query, max_results: 20 })
  if (error) throw error
  return (data ?? []) as GymSearchResult[]
}

export async function insertGym(
  supabase: SupabaseClient,
  gym: { name: string | null; lat: number; lng: number; equipment: GymEquipment; createdBy: string }
) {
  const { data, error } = await supabase
    .from('gyms')
    .insert({
      name: gym.name,
      location: `POINT(${gym.lng} ${gym.lat})`,
      source: 'user',
      status: 'unverified',
      equipment: gym.equipment,
      created_by: gym.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data as Gym
}

// Direct gym edit for admins — bypasses the suggestion/vote flow entirely.
// Authorized by the "Admins can update gyms" RLS policy, not an RPC.
export async function updateGymFields(
  supabase: SupabaseClient,
  gymId: string,
  fields: { name?: string | null; equipment?: GymEquipment; community_edited_fields?: string[] }
) {
  const { data, error } = await supabase
    .from('gyms')
    .update(fields)
    .eq('id', gymId)
    .select()
    .single()
  if (error) throw error
  return data as Gym
}

export async function getGymReviews(supabase: SupabaseClient, gymId: string) {
  const { data, error } = await supabase
    .from('gym_reviews')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as GymReview[]
}

export async function getGymReviewByUser(supabase: SupabaseClient, gymId: string, userId: string) {
  const { data, error } = await supabase
    .from('gym_reviews')
    .select('*')
    .eq('gym_id', gymId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as GymReview | null
}

export async function upsertGymReview(
  supabase: SupabaseClient,
  review: { gym_id: string; user_id: string; rating: number; comment: string | null }
) {
  const { data, error } = await supabase
    .from('gym_reviews')
    .upsert(review, { onConflict: 'gym_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return data as GymReview
}

export async function deleteGymReview(supabase: SupabaseClient, gymId: string, userId: string) {
  const { error } = await supabase
    .from('gym_reviews')
    .delete()
    .eq('gym_id', gymId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getPublicProfiles(supabase: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) return []
  const { data, error } = await supabase.rpc('get_public_profiles', { ids: userIds })
  if (error) throw error
  return (data ?? []) as PublicProfile[]
}

export type GymLeaderboardRow = { user_id: string; workout_count: number }

export async function getGymLeaderboardRows(supabase: SupabaseClient, gymId: string, maxResults = 20) {
  const { data, error } = await supabase.rpc('gym_leaderboard', {
    target_gym_id: gymId,
    max_results: maxResults,
  })
  if (error) throw error
  return (data ?? []) as GymLeaderboardRow[]
}

// Distinct gyms a user has trained at, with a workout count for each.
// Own rows only — no RLS workaround needed for a user's own passport.
export async function getUserGymWorkoutCounts(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('gym_id')
    .eq('user_id', userId)
    .not('gym_id', 'is', null)
    .not('completed_at', 'is', null)
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as { gym_id: string }[]) {
    counts.set(row.gym_id, (counts.get(row.gym_id) ?? 0) + 1)
  }
  return counts
}
