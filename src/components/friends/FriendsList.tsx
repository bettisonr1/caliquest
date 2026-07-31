'use client'

import { useState, useTransition } from 'react'
import { Flame, UserMinus, Zap } from 'lucide-react'
import { removeFriendAction } from '@/app/(app)/friends/actions'
import { Avatar } from '@/components/profile/Avatar'
import { levelProgress } from '@/lib/xp'
import type { FriendListEntry } from '@/lib/services/friends.service'

export function FriendsList({ friends }: { friends: FriendListEntry[] }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function remove(friendshipId: string) {
    startTransition(async () => {
      const result = await removeFriendAction(friendshipId)
      if (result.ok === false) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">
        Friends {friends.length > 0 && `(${friends.length})`}
      </h2>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {friends.length === 0 ? (
        <p className="text-sm text-gray-500">
          No friends yet — search for someone above to send a request.
        </p>
      ) : (
        <ul className="space-y-3">
          {friends.map(({ friendship, profile }) => (
            <li key={friendship.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar avatarUrl={profile.avatar_url} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{profile.username}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-emerald-400" />
                      Level {levelProgress(profile.total_xp).level}
                    </span>
                    {profile.streak_days > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-red-400" />
                        {profile.streak_days}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => remove(friendship.id)}
                disabled={isPending}
                aria-label={`Remove ${profile.username}`}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 disabled:opacity-50 transition-colors shrink-0"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
