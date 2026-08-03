'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { respondToInviteAction } from '@/app/(app)/squads/actions'
import type { SquadMembershipWithSquad } from '@/types/database'

export function SquadInvites({ invites }: { invites: SquadMembershipWithSquad[] }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function respond(squadId: string, accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await respondToInviteAction(squadId, accept)
      if (result.ok === false) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-yellow-500/40 bg-gray-900 p-5 space-y-3">
      <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Squad invites</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <ul className="space-y-2">
        {invites.map(invite => (
          <li key={invite.squad_id} className="flex items-center justify-between gap-3">
            <span className="text-sm text-white truncate">{invite.squads.name}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => respond(invite.squad_id, true)}
                disabled={isPending}
                aria-label={`Accept invite to ${invite.squads.name}`}
                className="h-9 w-9 -my-1 flex items-center justify-center rounded-lg bg-emerald-500 text-gray-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => respond(invite.squad_id, false)}
                disabled={isPending}
                aria-label={`Decline invite to ${invite.squads.name}`}
                className="h-9 w-9 -my-1 flex items-center justify-center rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
