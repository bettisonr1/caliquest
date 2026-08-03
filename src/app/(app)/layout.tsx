import Link from 'next/link'
import { Dumbbell, LayoutDashboard, Map, ScrollText, Shield, Trophy, User, Users } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/services/notifications.service'

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',   shortLabel: 'Home',    icon: LayoutDashboard },
  { href: '/workout',     label: 'Workout',     shortLabel: 'Workout', icon: Dumbbell        },
  { href: '/skills',      label: 'Skills',      shortLabel: 'Skills',  icon: Map             },
  { href: '/friends',     label: 'Friends',     shortLabel: 'Friends', icon: Users           },
  { href: '/squads',      label: 'Squads',      shortLabel: 'Squads',  icon: Shield          },
  { href: '/quests',      label: 'Quests',      shortLabel: 'Quests',  icon: ScrollText      },
  { href: '/leaderboard', label: 'Leaderboard', shortLabel: 'Ranks',   icon: Trophy          },
  { href: '/profile',     label: 'Profile',     shortLabel: 'Profile', icon: User            },
]

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
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-800 bg-gray-950 flex pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, shortLabel, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] max-w-full truncate px-0.5">{shortLabel}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
