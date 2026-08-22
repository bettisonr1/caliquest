import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Dumbbell, Flame, History, Zap } from 'lucide-react'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { levelProgress } from '@/lib/xp'
import {
  computeWeekStats,
  SevenDaySummary,
  sevenDaysAgoIso,
} from '@/components/dashboard/WorkoutCards'
import type { Profile, WorkoutWithSets } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const weekAgo = sevenDaysAgoIso()
  const [{ data: profileRow }, { data: weekRows }, { count: workoutCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('workouts')
      .select('*, workout_sets(id)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('started_at', weekAgo),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
  ])

  const profile = profileRow as Profile | null
  const weekWorkouts = (weekRows ?? []) as WorkoutWithSets[]
  const progress = levelProgress(profile?.total_xp ?? 0)

  return (
    <div className="space-y-8">
      {/* Header: greeting + level */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{profile ? `, ${profile.username}` : ''}
          </h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              Level {progress.level} · {(profile?.total_xp ?? 0).toLocaleString()} XP
            </span>
            {(profile?.streak_days ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-red-400" />
                {profile!.streak_days} day streak
              </span>
            )}
          </p>
        </div>
        <Link
          href="/workout"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          <Dumbbell className="h-4 w-4" /> Log workout
        </Link>
      </div>

      {(workoutCount ?? 0) > 0 ? (
        <>
          <SevenDaySummary stats={computeWeekStats(weekWorkouts, profile?.streak_days ?? 0)} />
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors"
          >
            <History className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Workout history</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your recent workouts now live on your profile.
              </p>
            </div>
            <span className="text-sm text-emerald-400 font-medium shrink-0">View →</span>
          </Link>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
          <Dumbbell className="h-8 w-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No workouts yet</p>
          <p className="text-sm text-gray-500 mt-1">
            <Link href="/workout" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Log your first workout
            </Link>{' '}
            to start earning XP.
          </p>
        </div>
      )}
    </div>
  )
}
