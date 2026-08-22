import { Suspense } from 'react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { MoreNavMenu } from '@/components/nav/MoreNavMenu'
import { DesktopPrimaryNav, MobilePrimaryNav } from '@/components/nav/PrimaryNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NotificationBellLoader } from '@/components/notifications/NotificationBellLoader'
import { getAuthenticatedUser } from '@/lib/supabase/server'

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-white">
            Cali<span className="text-emerald-400">Quest</span>
          </span>
          <nav className="hidden md:flex items-center gap-1">
            <DesktopPrimaryNav />
            <MoreNavMenu variant="desktop" />
            {bell}
            <LogoutButton />
          </nav>
          {/* The bottom nav has no room for logout/bell, so surface them here on mobile */}
          <div className="md:hidden flex items-center gap-1">
            {bell}
            <LogoutButton iconOnly />
          </div>
        </div>
      </header>

      {/* pb clears the fixed bottom nav on mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-800 bg-gray-950 flex pb-[env(safe-area-inset-bottom)]">
        <MobilePrimaryNav />
        <MoreNavMenu variant="mobile" />
      </nav>
    </div>
  )
}
