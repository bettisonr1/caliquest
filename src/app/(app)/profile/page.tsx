import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Award, CheckCircle, Dumbbell, Flame, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { levelProgress } from '@/lib/xp'
import { getRecentCompletedWorkouts } from '@/lib/repositories/workouts.repository'
import { getUserPassport } from '@/lib/services/gyms.service'
import { Avatar } from '@/components/profile/Avatar'
import { ProfileEditor } from '@/components/profile/ProfileEditor'
import { WorkoutHistory } from '@/components/workout/WorkoutHistory'
import { GymPassport } from '@/components/gyms/GymPassport'
import type { MuscleGroup, Profile } from '@/types/database'

const muscleGroups: { group: MuscleGroup; label: string; bar: string; text: string }[] = [
  { group: 'pull',     label: 'Pull',     bar: 'bg-blue-500',    text: 'text-blue-400'    },
  { group: 'push',     label: 'Push',     bar: 'bg-orange-500',  text: 'text-orange-400'  },
  { group: 'core',     label: 'Core',     bar: 'bg-yellow-500',  text: 'text-yellow-400'  },
  { group: 'legs',     label: 'Legs',     bar: 'bg-emerald-500', text: 'text-emerald-400' },
  { group: 'mobility', label: 'Mobility', bar: 'bg-purple-500',  text: 'text-purple-400'  },
]

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileRow },
    { data: mgXpRows },
    { count: workoutCount },
    { count: unlockedCount },
    recentWorkouts,
    passport,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('muscle_group_xp').select('*').eq('user_id', user.id),
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_skills').select('skill_id', { count: 'exact', head: true }).eq('user_id', user.id),
    getRecentCompletedWorkouts(supabase, user.id),
    getUserPassport(user.id),
  ])

  const profile = profileRow as Profile | null
  if (!profile) redirect('/login')

  const mgXp = Object.fromEntries(
    (mgXpRows ?? []).map(r => [r.muscle_group, r.xp])
  ) as Record<MuscleGroup, number>
  const maxMgXp = Math.max(1, ...Object.values(mgXp))

  const progress = levelProgress(profile.total_xp)
  const pct = Math.min(100, Math.round((progress.xpIntoLevel / progress.xpForLevel) * 100))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Identity card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center gap-5">
          <Avatar avatarUrl={profile.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white truncate">{profile.username}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{profile.prestige_tier}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
                {(workoutCount ?? 0).toLocaleString()} workouts
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                {(unlockedCount ?? 0).toLocaleString()} skills
              </span>
              {profile.streak_days > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-red-400" />
                  {profile.streak_days} day streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Level + XP progress */}
        <div className="mt-6">
          <div className="flex items-end justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Zap className="h-4 w-4 text-emerald-400" /> Level {progress.level}
            </span>
            <span className="text-xs text-gray-500">
              {progress.xpIntoLevel.toLocaleString()} / {progress.xpForLevel.toLocaleString()} XP to level {progress.level + 1}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex flex-col gap-1 mt-1.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {profile.total_xp.toLocaleString()} XP total
            </p>
            {/* Contributor Points: a separate, open-ended axis of progression
                (gym-suggestion accepts) — a plain count, not a bar, since
                there's no "next threshold" the way there is for XP/level. */}
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              {profile.contributor_points.toLocaleString()} Contributor Points
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ProfileEditor username={profile.username} avatarUrl={profile.avatar_url} />
        </div>
      </div>

      {/* Muscle group XP breakdown */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Muscle group XP</h2>
        <div className="space-y-3">
          {muscleGroups.map(({ group, label, bar, text }) => {
            const xp = mgXp[group] ?? 0
            return (
              <div key={group}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-semibold ${text}`}>{label}</span>
                  <span className="text-gray-500">{xp.toLocaleString()} XP</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div
                    className={`h-full rounded-full ${bar}`}
                    style={{ width: `${Math.round((xp / maxMgXp) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <GymPassport entries={passport} />

      {/* Workout history (fist-bump counts come from friends viewing this profile) */}
      <WorkoutHistory
        workouts={recentWorkouts}
        viewerId={user.id}
        canBump={false}
        emptyMessage="No workouts yet — log one from the Workout tab to start your history."
      />

      {recentWorkouts.length > 0 && (
        <p className="text-sm text-gray-500">
          Ready for the next one?{' '}
          <Link href="/workout" className="text-emerald-400 font-medium hover:text-emerald-300">
            Log a workout →
          </Link>
        </p>
      )}
    </div>
  )
}
