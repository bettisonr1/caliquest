'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { removeFriendAction, respondToFriendRequestAction } from '@/app/(app)/friends/actions'
import { Avatar } from '@/components/profile/Avatar'
import type { FriendListEntry } from '@/lib/services/friends.service'

type Props = {
  incoming: FriendListEntry[]
  outgoing: FriendListEntry[]
}

export function FriendRequests({ incoming, outgoing }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function respond(friendshipId: string, accept: boolean) {
    startTransition(async () => {
      const result = await respondToFriendRequestAction(friendshipId, accept)
      if (result.ok === false) setError(result.error)
    })
  }

  function cancel(friendshipId: string) {
    startTransition(async () => {
      const result = await removeFriendAction(friendshipId)
      if (result.ok === false) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">Requests</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {incoming.length > 0 && (
        <ul className="space-y-2">
          {incoming.map(({ friendship, profile }) => (
            <li key={friendship.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar avatarUrl={profile.avatar_url} size="sm" />
                <span className="text-sm text-white truncate">{profile.username}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => respond(friendship.id, true)}
                  disabled={isPending}
                  aria-label={`Accept ${profile.username}`}
                  className="h-9 w-9 -my-1 flex items-center justify-center rounded-lg bg-emerald-500 text-gray-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => respond(friendship.id, false)}
                  disabled={isPending}
                  aria-label={`Decline ${profile.username}`}
                  className="h-9 w-9 -my-1 flex items-center justify-center rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Sent</p>
          <ul className="space-y-2">
            {outgoing.map(({ friendship, profile }) => (
              <li key={friendship.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar avatarUrl={profile.avatar_url} size="sm" />
                  <span className="text-sm text-gray-300 truncate">{profile.username}</span>
                </div>
                <button
                  onClick={() => cancel(friendship.id)}
                  disabled={isPending}
                  className="p-2 -m-2 text-xs text-gray-500 hover:text-white disabled:opacity-50 transition-colors shrink-0"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
