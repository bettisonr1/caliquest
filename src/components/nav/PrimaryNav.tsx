'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { primaryNavItems } from '@/components/nav/nav-items'
import { triggerNavHaptic } from '@/lib/capacitor/haptics'

// A route is "active" for its own path and any nested path beneath it
// (e.g. /workout/123 keeps the Workout tab highlighted).
export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DesktopPrimaryNav() {
  const pathname = usePathname()

  return (
    <>
      {primaryNavItems.map(({ href, label, icon: Icon }) => {
        const active = isNavItemActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </>
  )
}

export function MobilePrimaryNav() {
  const pathname = usePathname()

  return (
    <>
      {primaryNavItems.map(({ href, shortLabel, icon: Icon }) => {
        const active = isNavItemActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            // iOS tab bars signal the current tab with icon/label tint
            // alone (no bar/pill), so a real tab switch also gets the
            // standard iOS "light impact" tap; re-tapping the tab you're
            // already on doesn't.
            onClick={() => {
              if (!active) triggerNavHaptic()
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 transition-colors active:scale-95 ${
              active ? 'text-emerald-400' : 'text-gray-500 hover:text-emerald-400'
            }`}
          >
            <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} />
            <span className="text-[10px] max-w-full truncate px-0.5">{shortLabel}</span>
          </Link>
        )
      })}
    </>
  )
}
