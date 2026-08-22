import { cache } from 'react'
import { NotificationBell } from './NotificationBell'
import { getUnreadCount } from '@/lib/services/notifications.service'

// Rendered twice by (app)/layout.tsx (desktop nav + mobile bar) inside
// separate Suspense boundaries so the unread-count query can't block the
// rest of the layout (and, in turn, the route's own loading.tsx skeleton)
// from appearing. cache() dedupes the two instances back down to one query
// per request.
const getUnreadCountCached = cache(getUnreadCount)

export async function NotificationBellLoader({ userId }: { userId: string }) {
  const unreadCount = await getUnreadCountCached(userId)
  return <NotificationBell initialUnreadCount={unreadCount} />
}
