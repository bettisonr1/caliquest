import { createClient } from '@/lib/supabase/server'
import {
  deleteGymReview,
  getGymById,
  getGymCoordinates,
  getGymLeaderboardRows,
  getGymReviewByUser,
  getGymReviews,
  getGymsByIds,
  getNearbyGyms,
  getPublicProfiles,
  getUserGymWorkoutCounts,
  insertGym,
  searchGymsByName,
  upsertGymReview,
} from '@/lib/repositories/gyms.repository'
import type {
  Gym,
  GymEquipment,
  GymLeaderboardEntry,
  GymRank,
  GymReviewWithProfile,
  GymSearchResult,
  GymTier,
  NearbyGym,
  PassportEntry,
} from '@/types/database'

// Dedupe guard radius for "is this the same gym?" when adding a new gym.
const DEDUPE_RADIUS_M = 100

// ------------------------------------------------------------
// Renown tiers — composite of review count, average rating, and
// (once workouts are tagged) tagged-workout volume, so a busy
// well-loved gym can't be outranked by two 5★ reviews alone.
// Service-layer constants, easy to retune once real data exists.
// ------------------------------------------------------------
const RENOWN_TIERS: { tier: GymTier; minReviews: number; minAvgRating: number }[] = [
  { tier: 'Temple', minReviews: 75, minAvgRating: 4.5 },
  { tier: 'Dojo',   minReviews: 25, minAvgRating: 4.3 },
  { tier: 'Forge',  minReviews: 10, minAvgRating: 4.0 },
  { tier: 'Yard',   minReviews: 3,  minAvgRating: 3.5 },
]

// Each 5 tagged workouts counts like one review toward the thresholds above.
const WORKOUTS_PER_EQUIVALENT_REVIEW = 5

export function computeGymTier(
  status: 'unverified' | 'verified',
  reviewCount: number,
  avgRating: number,
  workoutCount = 0
): GymTier {
  if (status === 'unverified') return 'Rumored Spot'

  const effectiveReviews = reviewCount + Math.floor(workoutCount / WORKOUTS_PER_EQUIVALENT_REVIEW)
  for (const t of RENOWN_TIERS) {
    if (effectiveReviews >= t.minReviews && avgRating >= t.minAvgRating) return t.tier
  }
  return 'Spot'
}

// ------------------------------------------------------------
// Legend ladder — per-gym, per-user workout counts.
// ------------------------------------------------------------
const GYM_RANKS: { rank: GymRank; minWorkouts: number }[] = [
  { rank: 'Legend',  minWorkouts: 40 },
  { rank: 'Regular', minWorkouts: 15 },
  { rank: 'Local',   minWorkouts: 5 },
  { rank: 'Visitor', minWorkouts: 1 },
]

export function computeGymRank(workoutCount: number): GymRank | null {
  for (const r of GYM_RANKS) {
    if (workoutCount >= r.minWorkouts) return r.rank
  }
  return null
}

export function reviewStats(reviews: { rating: number }[]): { count: number; avgRating: number } {
  if (reviews.length === 0) return { count: 0, avgRating: 0 }
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return { count: reviews.length, avgRating }
}

export async function getNearbyGymsForUser(lat: number, lng: number): Promise<NearbyGym[]> {
  const supabase = await createClient()
  return getNearbyGyms(supabase, lat, lng)
}

export async function searchGyms(query: string): Promise<GymSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const supabase = await createClient()
  return searchGymsByName(supabase, trimmed)
}

export async function findNearbyDuplicateGyms(lat: number, lng: number): Promise<NearbyGym[]> {
  const supabase = await createClient()
  return getNearbyGyms(supabase, lat, lng, DEDUPE_RADIUS_M, 5)
}

export async function addGym(
  userId: string,
  input: { name: string | null; lat: number; lng: number; equipment: GymEquipment }
): Promise<Gym> {
  if (input.lat < -90 || input.lat > 90 || input.lng < -180 || input.lng > 180) {
    throw new Error('INVALID_COORDINATES')
  }
  const supabase = await createClient()
  return insertGym(supabase, {
    name: input.name?.trim() || null,
    lat: input.lat,
    lng: input.lng,
    equipment: input.equipment,
    createdBy: userId,
  })
}

export type GymDetail = {
  gym: Gym
  lat: number
  lng: number
  tier: GymTier
  reviewCount: number
  avgRating: number
  reviews: GymReviewWithProfile[]
  viewerReview: GymReviewWithProfile | null
  leaderboard: GymLeaderboardEntry[]
}

export async function getGymDetail(gymId: string, viewerId: string): Promise<GymDetail | null> {
  const supabase = await createClient()

  const gym = await getGymById(supabase, gymId)
  if (!gym) return null

  const [reviews, leaderboardRows, coords] = await Promise.all([
    getGymReviews(supabase, gymId),
    getGymLeaderboardRows(supabase, gymId),
    getGymCoordinates(supabase, gymId),
  ])

  const profileIds = [...new Set(reviews.map(r => r.user_id))]
  const profiles = await getPublicProfiles(supabase, profileIds)
  const profileById = new Map(profiles.map(p => [p.user_id, p]))

  const reviewsWithProfile: GymReviewWithProfile[] = reviews.map(r => ({
    ...r,
    profile: profileById.get(r.user_id) ?? null,
  }))

  const { count, avgRating } = reviewStats(reviews)
  const workoutCount = leaderboardRows.reduce((sum, row) => sum + row.workout_count, 0)
  const tier = computeGymTier(gym.status, count, avgRating, workoutCount)

  const leaderboardProfileIds = leaderboardRows.map(row => row.user_id)
  const leaderboardProfiles = leaderboardProfileIds.some(id => profileById.has(id))
    ? profiles
    : await getPublicProfiles(supabase, leaderboardProfileIds)
  const leaderboardProfileById = new Map(leaderboardProfiles.map(p => [p.user_id, p]))

  const leaderboard: GymLeaderboardEntry[] = leaderboardRows.map(row => ({
    user_id: row.user_id,
    workout_count: row.workout_count,
    rank: computeGymRank(row.workout_count),
    profile: profileById.get(row.user_id) ?? leaderboardProfileById.get(row.user_id) ?? null,
  }))

  return {
    gym,
    lat: coords?.lat ?? 0,
    lng: coords?.lng ?? 0,
    tier,
    reviewCount: count,
    avgRating,
    reviews: reviewsWithProfile,
    viewerReview: reviewsWithProfile.find(r => r.user_id === viewerId) ?? null,
    leaderboard,
  }
}

export async function submitGymReview(
  userId: string,
  gymId: string,
  rating: number,
  comment: string | null
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('INVALID_RATING')
  }
  const supabase = await createClient()
  const gym = await getGymById(supabase, gymId)
  if (!gym) throw new Error('GYM_NOT_FOUND')

  await upsertGymReview(supabase, {
    gym_id: gymId,
    user_id: userId,
    rating,
    comment: comment?.trim() || null,
  })
}

export async function removeGymReview(userId: string, gymId: string): Promise<void> {
  const supabase = await createClient()
  const existing = await getGymReviewByUser(supabase, gymId, userId)
  if (!existing) return
  await deleteGymReview(supabase, gymId, userId)
}

export async function getUserPassport(userId: string): Promise<PassportEntry[]> {
  const supabase = await createClient()
  const counts = await getUserGymWorkoutCounts(supabase, userId)
  if (counts.size === 0) return []

  const gyms = await getGymsByIds(supabase, [...counts.keys()])
  const gymById = new Map(gyms.map(g => [g.id, g]))

  const rankOrder: GymRank[] = ['Legend', 'Regular', 'Local', 'Visitor']

  return [...counts.entries()]
    .map(([gymId, workoutCount]) => ({
      gym_id: gymId,
      gym_name: gymById.get(gymId)?.name ?? null,
      workout_count: workoutCount,
      rank: computeGymRank(workoutCount) ?? 'Visitor',
    }))
    .sort((a, b) => {
      const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
      return rankDiff !== 0 ? rankDiff : b.workout_count - a.workout_count
    })
}
