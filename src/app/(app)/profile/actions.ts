'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AVATAR_BACKGROUNDS, AVATAR_EMOJIS, serializeAvatar } from '@/lib/avatar'
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
