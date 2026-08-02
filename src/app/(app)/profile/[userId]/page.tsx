import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Dumbbell, Flame, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { levelProgress } from '@/lib/xp'
import { getFriendProfileData } from '@/lib/services/profile.service'
import { Avatar } from '@/components/profile/Avatar'
import { WorkoutHistory } from '@/components/workout/WorkoutHistory'

export default async function FriendProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (userId === user.id) redirect('/profile')

  const data = await getFriendProfileData(user.id, userId)

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-400 font-medium">This profile isn&apos;t available</p>
          <p className="text-sm text-gray-500 mt-1">
            You can only view the profiles of accepted friends.
          </p>
          <Link
            href="/friends"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-emerald-400 font-medium hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to friends
          </Link>
        </div>
      </div>
    )
  }

  const { profile, workoutCount, workouts } = data
  const progress = levelProgress(profile.total_xp)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/friends"
        className="inline-flex items-center gap-1.5 py-2 -my-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Friends
      </Link>

      {/* Identity card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center gap-5">
          <Avatar avatarUrl={profile.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white truncate">{profile.username}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{profile.prestige_tier}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                Level {progress.level} · {profile.total_xp.toLocaleString()} XP
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
                {workoutCount.toLocaleString()} workouts
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
      </div>

      {/* Their recent workouts — tap 🤜 to show respect */}
      <WorkoutHistory
        workouts={workouts}
        viewerId={user.id}
        canBump
        emptyMessage={`${profile.username} hasn't logged a workout yet.`}
      />
    </div>
  )
}
