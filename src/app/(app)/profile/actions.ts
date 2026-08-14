'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { AVATAR_BACKGROUNDS, AVATAR_EMOJIS, serializeAvatar } from '@/lib/avatar'
import { toggleFistBump } from '@/lib/services/profile.service'
import { deleteAccount } from '@/lib/services/account.service'
import type { AvatarBackground } from '@/lib/avatar'

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string }

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

export async function updateProfile(input: {
  username: string
  avatarEmoji: string
  avatarBackground: string
}): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const username = input.username.trim()
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: 'Username must be 3–20 characters: letters, numbers, or underscores.' }
  }
  if (!(AVATAR_EMOJIS as readonly string[]).includes(input.avatarEmoji)) {
    return { ok: false, error: 'Pick an avatar from the list.' }
  }
  if (!(input.avatarBackground in AVATAR_BACKGROUNDS)) {
    return { ok: false, error: 'Pick a background from the list.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      avatar_url: serializeAvatar({
        emoji: input.avatarEmoji,
        background: input.avatarBackground as AvatarBackground,
      }),
    })
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'That username is already taken.' }
    }
    return { ok: false, error: 'Could not save your profile. Please try again.' }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
  return { ok: true }
}

const fistBumpErrors: Record<string, string> = {
  NOT_FOUND: 'That workout is no longer available.',
  CANNOT_BUMP_OWN_WORKOUT: "You can't fist-bump your own workout.",
}

export async function toggleFistBumpAction(
  workoutId: string
): Promise<{ ok: true; bumped: boolean } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const { bumped, workoutOwnerId } = await toggleFistBump(user.id, workoutId)
    revalidatePath(`/profile/${workoutOwnerId}`)
    return { ok: true, bumped }
  } catch (e) {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    return { ok: false, error: fistBumpErrors[code] ?? 'Something went wrong. Please try again.' }
  }
}

const deleteAccountErrors: Record<string, string> = {
  DELETE_FAILED: 'Could not delete your account. Please try again or contact support.',
}

// Guideline 5.1.1(v): an in-app, self-serve way to delete the account and
// its data (not just "contact support"). See account.service.ts for what
// deleting the auth user cascades to, and DeleteAccountSection for the
// confirmation UI.
export async function deleteAccountAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const log = logger.child({ userId: user.id, feature: 'account', action: 'deleteAccount' })

  try {
    await deleteAccount(user.id)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    log.error({ err: e, code }, 'deleteAccount action failed')
    return { ok: false, error: deleteAccountErrors[code] ?? 'Could not delete your account. Please try again.' }
  }

  // The auth user (and its cookies' backing row) no longer exists; clear the
  // local session too so the client doesn't hold a stale one.
  await supabase.auth.signOut()
  log.info('Signed out after account deletion')
  return { ok: true }
}
