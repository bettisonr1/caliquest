import Link from 'next/link'
import { Activity, CalendarDays, Clock, Dumbbell, Flame, Repeat, Zap } from 'lucide-react'
import type { MuscleGroup, WorkoutWithSets } from '@/types/database'

const chipClass: Record<MuscleGroup, string> = {
  pull:     'bg-blue-500/20 text-blue-400',
  push:     'bg-orange-500/20 text-orange-400',
  core:     'bg-yellow-500/20 text-yellow-400',
  legs:     'bg-emerald-500/20 text-emerald-400',
  mobility: 'bg-purple-500/20 text-purple-400',
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit',
})

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

// ---------------------------------------------------------------
// Detailed card for the most recent workout
// ---------------------------------------------------------------

type ExerciseGroup = {
  name:         string
  muscleGroup:  MuscleGroup
  type:         'reps' | 'duration'
  sets:         { reps: number | null; duration_seconds: number | null }[]
  xp:           number
}

function groupSetsByExercise(workout: WorkoutWithSets): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>()
  for (const set of workout.workout_sets) {
    if (!set.exercises) continue
    let group = groups.get(set.exercise_id)
    if (!group) {
      group = {
        name:        set.exercises.name,
        muscleGroup: set.exercises.muscle_group,
        type:        set.exercises.type,
        sets:        [],
        xp:          0,
      }
      groups.set(set.exercise_id, group)
    }
    group.sets.push({ reps: set.reps, duration_seconds: set.duration_seconds })
    group.xp += set.xp_earned
  }
  return [...groups.values()]
}

function describeSets(group: ExerciseGroup): string {
  const values = group.sets.map(s =>
    group.type === 'reps' ? (s.reps ?? 0) : (s.duration_seconds ?? 0)
  )
  const unit = group.type === 'reps' ? 'reps' : 's'
  const allEqual = values.every(v => v === values[0])
  if (allEqual) return `${values.length} × ${values[0]}${unit === 's' ? 's' : ' reps'}`
  return values.map(v => `${v}${unit === 's' ? 's' : ''}`).join(', ') + (unit === 's' ? '' : ' reps')
}

export function LatestWorkoutCard({ workout }: { workout: WorkoutWithSets }) {
  const exercises = groupSetsByExercise(workout)
  const when = new Date(workout.started_at)
  return (
    <section>
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Latest workout</h2>
      <div className="rounded-2xl border border-emerald-500/30 bg-gray-900 p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-semibold text-white">{dateFormat.format(when)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {timeFormat.format(when)} · {exercises.length} exercise{exercises.length === 1 ? '' : 's'} · {workout.workout_sets.length} sets
            </p>
          </div>
          <span className="flex items-center gap-1 text-lg font-bold text-emerald-400 shrink-0">
            <Zap className="h-4 w-4" />+{workout.total_xp.toLocaleString()} XP
          </span>
        </div>

        <ul className="divide-y divide-gray-800">
          {exercises.map(group => (
            <li key={group.name} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {group.type === 'duration'
                  ? <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  : <Repeat className="h-3.5 w-3.5 text-gray-500 shrink-0" />}
                <span className="text-sm text-white font-medium truncate">{group.name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${chipClass[group.muscleGroup]}`}>
                  {group.muscleGroup}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-sm">
                <span className="text-gray-400">{describeSets(group)}</span>
                <span className="text-emerald-400 font-medium w-16 text-right">+{group.xp} XP</span>
              </div>
            </li>
          ))}
        </ul>

        {workout.notes && (
          <p className="mt-3 pt-3 border-t border-gray-800 text-sm text-gray-400 italic">
            “{workout.notes}”
          </p>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------
// Compact rows for earlier workouts
// ---------------------------------------------------------------

export function RecentWorkouts({ workouts }: { workouts: WorkoutWithSets[] }) {
  return (
    <section>
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent workouts</h2>
      <div className="rounded-2xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
        {workouts.map(workout => {
          const exerciseNames = [...new Set(
            workout.workout_sets.map(s => s.exercises?.name).filter(Boolean)
          )] as string[]
          return (
            <div key={workout.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{dateFormat.format(new Date(workout.started_at))}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {exerciseNames.slice(0, 3).join(' · ')}
                  {exerciseNames.length > 3 ? ` +${exerciseNames.length - 3} more` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-sm">
                <span className="text-gray-500 hidden sm:inline">{workout.workout_sets.length} sets</span>
                <span className="text-emerald-400 font-semibold">+{workout.total_xp.toLocaleString()} XP</span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-sm text-gray-500">
        Ready for the next one?{' '}
        <Link href="/workout" className="text-emerald-400 font-medium hover:text-emerald-300">
          Log a workout →
        </Link>
      </p>
    </section>
  )
}
