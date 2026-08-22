'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import {
  removeFriend,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '@/lib/services/friends.service'
import type { PublicProfile } from '@/types/database'

const errorMessages: Record<string, string> = {
  CANNOT_FRIEND_SELF: "You can't send a friend request to yourself.",
  NOT_FOUND: 'That friend request no longer exists.',
}

function friendlyError(e: unknown): string {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  return errorMessages[code] ?? 'Something went wrong. Please try again.'
}

export async function searchUsersAction(
  query: string
): Promise<{ ok: true; results: PublicProfile[] } | { ok: false; error: string }> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const results = await searchUsers(user.id, query)
    return { ok: true, results }
  } catch (e) {
    return { ok: false, error: friendlyError(e) }
  }
}

export async function sendFriendRequestAction(
  targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await sendFriendRequest(user.id, targetUserId)
  } catch (e) {
    return { ok: false, error: friendlyError(e) }
  }

  revalidatePath('/friends')
  return { ok: true }
}

export async function respondToFriendRequestAction(
  friendshipId: string,
  accept: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await respondToFriendRequest(user.id, friendshipId, accept)
  } catch (e) {
    return { ok: false, error: friendlyError(e) }
  }

  revalidatePath('/friends')
  return { ok: true }
}

export async function removeFriendAction(
  friendshipId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await removeFriend(user.id, friendshipId)
  } catch (e) {
    return { ok: false, error: friendlyError(e) }
  }

  revalidatePath('/friends')
  return { ok: true }
}
