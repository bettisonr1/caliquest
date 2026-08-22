import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getFriendsPageData } from '@/lib/services/friends.service'
import { AddFriendForm } from '@/components/friends/AddFriendForm'
import { FriendRequests } from '@/components/friends/FriendRequests'
import { FriendsList } from '@/components/friends/FriendsList'

export default async function FriendsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const { friends, incoming, outgoing } = await getFriendsPageData(user.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Friends</h1>
        <p className="text-gray-400 text-sm mt-1">
          Add friends to view their profiles, fist-bump their workouts, and see them on the leaderboard.
        </p>
      </div>

      <AddFriendForm />

      {(incoming.length > 0 || outgoing.length > 0) && (
        <FriendRequests incoming={incoming} outgoing={outgoing} />
      )}

      <FriendsList friends={friends} />
    </div>
  )
}
