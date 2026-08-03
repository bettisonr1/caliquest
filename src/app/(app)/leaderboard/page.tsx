import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFriendsLeaderboard } from '@/lib/services/friends.service'
import { FriendLeaderboard } from '@/components/leaderboard/FriendLeaderboard'
import { PeriodToggle } from '@/components/leaderboard/PeriodToggle'
import type { LeaderboardPeriod } from '@/types/database'

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period: LeaderboardPeriod = rawPeriod === 'month' ? 'month' : 'week'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const entries = await getFriendsLeaderboard(user.id, period)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400 text-sm mt-1">Friends ranked by number of workouts.</p>
      </div>

      <PeriodToggle period={period} />

      <FriendLeaderboard entries={entries} />
    </div>
  )
}
