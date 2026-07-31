import Link from 'next/link'
import { Dumbbell, LayoutDashboard, Map, ScrollText, Trophy, User, Users } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/workout',     label: 'Workout',    icon: Dumbbell        },
  { href: '/skills',      label: 'Skills',     icon: Map             },
  { href: '/friends',     label: 'Friends',    icon: Users           },
  { href: '/quests',      label: 'Quests',     icon: ScrollText      },
  { href: '/leaderboard', label: 'Leaderboard',icon: Trophy          },
  { href: '/profile',     label: 'Profile',    icon: User            },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
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
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950 flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
