import { LogoutButton } from '@/components/auth/LogoutButton'
import { MoreNavMenu } from '@/components/nav/MoreNavMenu'
import { DesktopPrimaryNav, MobilePrimaryNav } from '@/components/nav/PrimaryNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/services/notifications.service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const unreadCount = user ? await getUnreadCount(user.id) : 0

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
            <NotificationBell initialUnreadCount={unreadCount} />
            <LogoutButton />
          </nav>
          {/* The bottom nav has no room for logout/bell, so surface them here on mobile */}
          <div className="md:hidden flex items-center gap-1">
            <NotificationBell initialUnreadCount={unreadCount} />
            <LogoutButton iconOnly />
          </div>
        </div>
      </header>

      {/* pb clears the fixed bottom nav on mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav — translucent + blurred like a native iOS tab
          bar, rather than the flat solid bar this used to be. Content
          scrolling underneath shows through, which is what actually reads
          as "iOS" here since Capacitor renders our own CSS, not a real
          UITabBar. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-gray-950/80 backdrop-blur-xl backdrop-saturate-150 flex pb-[env(safe-area-inset-bottom)]">
        <MobilePrimaryNav />
        <MoreNavMenu variant="mobile" />
      </nav>
    </div>
  )
}
