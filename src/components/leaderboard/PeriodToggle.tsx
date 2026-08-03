import Link from 'next/link'
import type { LeaderboardPeriod } from '@/types/database'

const OPTIONS: { period: LeaderboardPeriod; label: string }[] = [
  { period: 'week', label: 'This week' },
  { period: 'month', label: 'This month' },
]

export function PeriodToggle({ period }: { period: LeaderboardPeriod }) {
  return (
    <div className="flex gap-2 rounded-lg border border-gray-800 bg-gray-900 p-1">
      {OPTIONS.map(option => (
        <Link
          key={option.period}
          href={`/leaderboard?period=${option.period}`}
          className={`flex-1 min-h-11 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
            period === option.period
              ? 'bg-emerald-500 text-gray-950'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}
