import { createClient } from '@/lib/supabase/server'
import { findFriendshipBetween } from '@/lib/repositories/friendships.repository'
import { getProfilesByUserIds } from '@/lib/repositories/profiles.repository'
import {
  countCompletedWorkouts,
  deleteFistbump,
  findFistbump,
  getRecentCompletedWorkouts,
  getWorkoutById,
  insertFistbump,
} from '@/lib/repositories/workouts.repository'
import type { Profile, WorkoutWithBumps } from '@/types/database'

export type FriendProfileData = {
  profile:      Profile
  workoutCount: number
  workouts:     WorkoutWithBumps[]
}

// Loads a friend's profile page. Returns null unless the viewer has an
// accepted friendship with the target (RLS would block the reads anyway;
// checking first lets the page render a clear "not friends" state).
export async function getFriendProfileData(
  viewerId: string,
  targetUserId: string
): Promise<FriendProfileData | null> {
  const supabase = await createClient()

  const friendship = await findFriendshipBetween(supabase, viewerId, targetUserId)
  if (!friendship || friendship.status !== 'accepted') return null

  const [profiles, workoutCount, workouts] = await Promise.all([
    getProfilesByUserIds(supabase, [targetUserId]),
    countCompletedWorkouts(supabase, targetUserId),
    getRecentCompletedWorkouts(supabase, targetUserId),
  ])

  const profile = profiles[0]
  if (!profile) return null

  return { profile, workoutCount, workouts }
}

// Adds or removes the user's fist-bump on a friend's workout.
export async function toggleFistBump(
  userId: string,
  workoutId: string
): Promise<{ bumped: boolean; workoutOwnerId: string }> {
  const supabase = await createClient()

  // RLS: only visible if the workout is the user's own or a friend's
  const workout = await getWorkoutById(supabase, workoutId)
  if (!workout) throw new Error('NOT_FOUND')
  if (workout.user_id === userId) throw new Error('CANNOT_BUMP_OWN_WORKOUT')

  const alreadyBumped = await findFistbump(supabase, workoutId, userId)
  if (alreadyBumped) {
    await deleteFistbump(supabase, workoutId, userId)
  } else {
    await insertFistbump(supabase, workoutId, userId)
  }
  return { bumped: !alreadyBumped, workoutOwnerId: workout.user_id }
}
