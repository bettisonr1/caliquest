'use client'

import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { MoreNavMenu } from '@/components/nav/MoreNavMenu'
import { DesktopPrimaryNav, MobilePrimaryNav } from '@/components/nav/PrimaryNav'

// Routes whose content wants the entire mobile viewport (edge-to-edge, up
// to where the header would be) instead of the header + padded main. The
// header is hidden on mobile only — desktop keeps it — and the page itself
// is responsible for surfacing any header-only controls (see GymsExplorer's
// floating top bar) since they no longer render here.
const FULL_BLEED_MOBILE_ROUTES = new Set(['/gyms'])

export function AppShell({
  bell,
  children,
}: {
  // Pre-rendered by the (app) layout (a Suspense-wrapped NotificationBellLoader
  // server component) so the unread-count query doesn't block this client
  // component from rendering. Rendered twice below (desktop nav + mobile
  // bar); NotificationBellLoader's cache() dedupes that back to one query.
  bell: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const fullBleed = FULL_BLEED_MOBILE_ROUTES.has(pathname)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header
        className={`border-b border-gray-800 bg-gray-950 sticky top-0 z-20 pt-[env(safe-area-inset-top)] ${
          fullBleed ? 'hidden md:block' : ''
        }`}
      >
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

      {/* pb clears the fixed bottom nav on mobile. Full-bleed routes handle
          their own spacing (they're fixed-positioned against the viewport,
          not laid out in this flow) so they get no padding here. */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto ${
          fullBleed ? 'p-0 md:px-4 md:py-6 md:pb-6' : 'px-4 py-6 pb-24 md:pb-6'
        }`}
      >
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
