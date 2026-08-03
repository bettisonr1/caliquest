import { createClient } from '@/lib/supabase/server'
import {
  countUnreadNotifications,
  getNotifications,
  markAllNotificationsRead,
} from '@/lib/repositories/notifications.repository'
import type { Notification } from '@/types/database'

export type BellData = {
  notifications: Notification[]
  unreadCount: number
}

export async function getBellData(userId: string): Promise<BellData> {
  const supabase = await createClient()
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(supabase, userId),
    countUnreadNotifications(supabase, userId),
  ])
  return { notifications, unreadCount }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()
  return countUnreadNotifications(supabase, userId)
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = await createClient()
  await markAllNotificationsRead(supabase, userId)
}
