import { CalendarDays, Dumbbell, LayoutDashboard, Map, MapPin, ScrollText, Shield, Trophy, User, Users, type LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon }

// Core gameplay loop stays visible at all times; everything else lives behind "More".
export const primaryNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home',    icon: LayoutDashboard },
  { href: '/workout',   label: 'Workout',   shortLabel: 'Workout', icon: Dumbbell        },
  { href: '/skills',    label: 'Skills',    shortLabel: 'Skills',  icon: Map             },
  { href: '/quests',    label: 'Quests',    shortLabel: 'Quests',  icon: ScrollText      },
]

export const moreNavItems: NavItem[] = [
  { href: '/gyms',         label: 'Gyms',         icon: MapPin      },
  { href: '/friends',      label: 'Friends',      icon: Users       },
  { href: '/squads',       label: 'Squads',       icon: Shield      },
  { href: '/competitions', label: 'Competitions', icon: CalendarDays },
  { href: '/leaderboard',  label: 'Leaderboard',  icon: Trophy      },
  { href: '/profile',      label: 'Profile',      icon: User        },
]
