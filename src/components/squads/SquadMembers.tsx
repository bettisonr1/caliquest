'use client'

import { useState, useTransition } from 'react'
import { UserMinus, UserPlus } from 'lucide-react'
import { inviteToSquadAction, leaveSquadAction, removeMemberAction } from '@/app/(app)/squads/actions'
import { Avatar } from '@/components/profile/Avatar'
import { useRouter } from 'next/navigation'
import type { PublicProfile, SquadMemberWithProfile } from '@/types/database'

type Props = {
  squadId: string
  members: SquadMemberWithProfile[]
  invitableFriends: PublicProfile[]
  viewerId: string
  isLeader: boolean
}

export function SquadMembers({ squadId, members, invitableFriends, viewerId, isLeader }: Props) {
  const router = useRouter()
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function invite(targetUserId: string) {
    setError(null)
    startTransition(async () => {
      const result = await inviteToSquadAction(squadId, targetUserId)
      if (result.ok === false) setError(result.error)
    })
  }

  function remove(targetUserId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeMemberAction(squadId, targetUserId)
      if (result.ok === false) setError(result.error)
    })
  }

  function leave() {
    setError(null)
    startTransition(async () => {
      const result = await leaveSquadAction(squadId)
      if (result.ok === false) {
        setError(result.error)
        return
      }
      router.push('/squads')
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
          Members ({members.length})
        </h2>
        {isLeader && invitableFriends.length > 0 && (
          <button
            onClick={() => setInviting(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {inviting && (
        <ul className="space-y-1.5 rounded-xl bg-gray-800/60 border border-gray-800 p-2">
          {invitableFriends.map(friend => (
            <li key={friend.user_id} className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar avatarUrl={friend.avatar_url} size="sm" />
                <span className="text-sm text-white truncate">{friend.username}</span>
              </div>
              <button
                onClick={() => invite(friend.user_id)}
                disabled={isPending}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-gray-950 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors shrink-0"
              >
                Invite
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="space-y-2">
        {members.map(member => (
          <li key={member.user_id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar avatarUrl={member.profile.avatar_url} size="sm" />
              <span className="text-sm text-white truncate">{member.profile.username}</span>
              {member.role === 'leader' && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 shrink-0">
                  Leader
                </span>
              )}
            </div>
            {isLeader && member.user_id !== viewerId && (
              <button
                onClick={() => remove(member.user_id)}
                disabled={isPending}
                aria-label={`Remove ${member.profile.username}`}
                className="h-9 w-9 -my-1 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 disabled:opacity-50 transition-colors shrink-0"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        onClick={leave}
        disabled={isPending}
        className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50 transition-colors"
      >
        Leave squad
      </button>
    </div>
  )
}
