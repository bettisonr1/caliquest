import { Suspense } from 'react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { MoreNavMenu } from '@/components/nav/MoreNavMenu'
import { DesktopPrimaryNav, MobilePrimaryNav } from '@/components/nav/PrimaryNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NotificationBellLoader } from '@/components/notifications/NotificationBellLoader'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { AppShell } from '@/components/nav/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/services/notifications.service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthenticatedUser()

  // The unread count is fetched by NotificationBellLoader, inside Suspense,
  // rather than awaited here — this function must stay synchronous-fast so
  // Next can start streaming the layout (and the route's own loading.tsx
  // skeleton) immediately instead of stalling behind a DB round trip that
  // isn't needed for first paint. Fallback shows the bell with no badge.
  const bell = user ? (
    <Suspense fallback={<NotificationBell initialUnreadCount={0} />}>
      <NotificationBellLoader userId={user.id} />
    </Suspense>
  ) : (
    <NotificationBell initialUnreadCount={0} />
  )

  return <AppShell unreadCount={unreadCount}>{children}</AppShell>
}
