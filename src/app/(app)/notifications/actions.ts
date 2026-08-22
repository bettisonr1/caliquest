'use server'

import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getBellData, markAllRead, type BellData } from '@/lib/services/notifications.service'

export async function getNotificationsAction(): Promise<
  { ok: true; data: BellData } | { ok: false; error: string }
> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const data = await getBellData(user.id)
  return { ok: true, data }
}

export async function markAllReadAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  await markAllRead(user.id)
  return { ok: true }
}
