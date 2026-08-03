import { createClient } from '@/lib/supabase/server'
import {
  acceptFriendRequest,
  deleteFriendship,
  findFriendshipBetween,
  getAcceptedFriendships,
  getFriendshipById,
  getIncomingRequests,
  getOutgoingRequests,
  insertFriendRequest,
  searchProfilesByUsername,
} from '@/lib/repositories/friendships.repository'
import { getProfilesByUserIds } from '@/lib/repositories/profiles.repository'
import { getCompletedWorkoutCountsSince } from '@/lib/repositories/workouts.repository'
import type { Friendship, FriendLeaderboardEntry, LeaderboardPeriod, Profile, PublicProfile } from '@/types/database'

export type FriendListEntry = { friendship: Friendship; profile: Profile }

function otherUserId(friendship: Friendship, userId: string): string {
  return friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id
}

function zipWithProfiles(friendships: Friendship[], userId: string, profiles: Profile[]): FriendListEntry[] {
  const byId = new Map(profiles.map(p => [p.user_id, p]))
  return friendships
    .map(friendship => {
      const profile = byId.get(otherUserId(friendship, userId))
      return profile ? { friendship, profile } : null
    })
    .filter((entry): entry is FriendListEntry => entry !== null)
}

export async function getFriendsPageData(userId: string): Promise<{
  friends: FriendListEntry[]
  incoming: FriendListEntry[]
  outgoing: FriendListEntry[]
}> {
  const supabase = await createClient()

  const [accepted, incomingRequests, outgoingRequests] = await Promise.all([
    getAcceptedFriendships(supabase, userId),
    getIncomingRequests(supabase, userId),
    getOutgoingRequests(supabase, userId),
  ])

  const allFriendships = [...accepted, ...incomingRequests, ...outgoingRequests]
  const otherIds = [...new Set(allFriendships.map(f => otherUserId(f, userId)))]
  const profiles = await getProfilesByUserIds(supabase, otherIds)

  return {
    friends: zipWithProfiles(accepted, userId, profiles),
    incoming: zipWithProfiles(incomingRequests, userId, profiles),
    outgoing: zipWithProfiles(outgoingRequests, userId, profiles),
  }
}

export async function searchUsers(userId: string, query: string): Promise<PublicProfile[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const supabase = await createClient()
  return searchProfilesByUsername(supabase, trimmed)
}

export async function sendFriendRequest(userId: string, targetUserId: string): Promise<void> {
  if (targetUserId === userId) throw new Error('CANNOT_FRIEND_SELF')

  const supabase = await createClient()
  const existing = await findFriendshipBetween(supabase, userId, targetUserId)

  if (!existing) {
    await insertFriendRequest(supabase, userId, targetUserId)
    return
  }
  if (existing.status === 'accepted') return
  if (existing.requester_id === userId) return
  await acceptFriendRequest(supabase, existing.id)
}

export async function respondToFriendRequest(userId: string, friendshipId: string, accept: boolean): Promise<void> {
  const supabase = await createClient()
  const friendship = await getFriendshipById(supabase, friendshipId)
  if (!friendship || friendship.addressee_id !== userId || friendship.status !== 'pending') {
    throw new Error('NOT_FOUND')
  }

  if (accept) {
    await acceptFriendRequest(supabase, friendshipId)
  } else {
    await deleteFriendship(supabase, friendshipId)
  }
}

function leaderboardWindowStart(period: LeaderboardPeriod): string {
  const start = new Date()
  if (period === 'week') start.setDate(start.getDate() - 7)
  else start.setMonth(start.getMonth() - 1)
  return start.toISOString()
}

// Friends leaderboard: viewer + accepted friends, ranked by completed
// workouts within the given window. Workout counts come straight from the
// workouts table rather than a security-definer RPC — its own RLS policy
// already exposes the viewer's and their friends' rows.
export async function getFriendsLeaderboard(
  userId: string,
  period: LeaderboardPeriod
): Promise<FriendLeaderboardEntry[]> {
  const supabase = await createClient()

  const accepted = await getAcceptedFriendships(supabase, userId)
  const friendIds = accepted.map(f => otherUserId(f, userId))
  const memberIds = [...new Set([userId, ...friendIds])]

  const since = leaderboardWindowStart(period)
  const [counts, profiles] = await Promise.all([
    getCompletedWorkoutCountsSince(supabase, memberIds, since),
    getProfilesByUserIds(supabase, memberIds),
  ])
  const profileById = new Map(profiles.map(p => [p.user_id, p]))

  return memberIds
    .map((id): FriendLeaderboardEntry | null => {
      const profile = profileById.get(id)
      if (!profile) return null
      return {
        user_id: id,
        workout_count: counts.get(id) ?? 0,
        profile,
        isViewer: id === userId,
      }
    })
    .filter((entry): entry is FriendLeaderboardEntry => entry !== null)
    .sort((a, b) => b.workout_count - a.workout_count || a.profile.username.localeCompare(b.profile.username))
}

export async function removeFriend(userId: string, friendshipId: string): Promise<void> {
  const supabase = await createClient()
  const friendship = await getFriendshipById(supabase, friendshipId)
  if (!friendship || (friendship.requester_id !== userId && friendship.addressee_id !== userId)) {
    throw new Error('NOT_FOUND')
  }
  await deleteFriendship(supabase, friendshipId)
}
