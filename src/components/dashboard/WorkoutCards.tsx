import { Activity, CalendarDays, Dumbbell, Flame, Zap } from 'lucide-react'
import type { WorkoutWithSets } from '@/types/database'

// ---------------------------------------------------------------
// Last 7 days summary strip
// ---------------------------------------------------------------

export function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

type WeekStats = {
  workouts:   number
  xp:         number
  sets:       number
  activeDays: number
  streakDays: number
}

export function computeWeekStats(workouts: WorkoutWithSets[], streakDays: number): WeekStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = workouts.filter(w => new Date(w.started_at).getTime() >= weekAgo)
  const days = new Set(recent.map(w => new Date(w.started_at).toDateString()))
  return {
    workouts:   recent.length,
    xp:         recent.reduce((sum, w) => sum + w.total_xp, 0),
    sets:       recent.reduce((sum, w) => sum + w.workout_sets.length, 0),
    activeDays: days.size,
    streakDays,
  }
}

export function SevenDaySummary({ stats }: { stats: WeekStats }) {
  const tiles = [
    { label: 'Workouts',    value: stats.workouts.toLocaleString(),   icon: Dumbbell,     color: 'text-blue-400'    },
    { label: 'XP earned',   value: stats.xp.toLocaleString(),         icon: Zap,          color: 'text-emerald-400' },
    { label: 'Sets logged', value: stats.sets.toLocaleString(),       icon: Activity,     color: 'text-orange-400'  },
    { label: 'Days active', value: `${stats.activeDays} / 7`,         icon: CalendarDays, color: 'text-yellow-400'  },
    { label: 'Streak',      value: `${stats.streakDays}d`,            icon: Flame,        color: 'text-red-400'     },
  ]
  return (
    <section>
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Last 7 days</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <Icon className={`h-4 w-4 ${color} mb-2`} />
            <p className="text-2xl font-bold text-white leading-none">{value}</p>
            <p className="text-xs text-gray-500 mt-1.5">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
