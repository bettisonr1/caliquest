'use client'

import { useState, useTransition } from 'react'
import { Check, HandHeart, Trophy } from 'lucide-react'
import { cancelParticipationAction, setParticipationAction } from '@/app/(app)/competitions/actions'
import type { CompetitionIntent, CompetitionParticipantStatus } from '@/types/database'

type Props = {
  competitionId: string
  initialStatus: CompetitionParticipantStatus | null
  canRegisterToCompete: boolean
  canAttend: boolean
}

export function RegisterButtons({ competitionId, initialStatus, canRegisterToCompete, canAttend }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function setIntent(intent: CompetitionIntent) {
    setError(null)
    startTransition(async () => {
      const result = await setParticipationAction(competitionId, intent)
      if (result.ok === false) setError(result.error)
      else setStatus(result.data)
    })
  }

  function cancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelParticipationAction(competitionId)
      if (result.ok === false) setError(result.error)
      else setStatus(null)
    })
  }

  if (status) {
    const label =
      status.intent === 'attending'
        ? "You're attending"
        : status.waitlisted
          ? `You're #${status.queue_position} on the waitlist`
          : "You're registered to compete"

    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <Check className="h-4 w-4 shrink-0" /> {label}
        </p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          onClick={cancel}
          disabled={isPending}
          className="mt-3 py-2 -my-1 text-xs font-semibold text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Updating…' : status.intent === 'attending' ? 'Cancel attendance' : 'Cancel registration'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIntent('competing')}
        disabled={isPending || !canRegisterToCompete}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        <Trophy className="h-4 w-4" /> {isPending ? 'Saving…' : 'Register to compete'}
      </button>
      <button
        onClick={() => setIntent('attending')}
        disabled={isPending || !canAttend}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        <HandHeart className="h-4 w-4" /> {isPending ? 'Saving…' : "I'm attending to support"}
      </button>
      {!canRegisterToCompete && canAttend && (
        <p className="text-xs text-gray-500 text-center">Registration to compete has closed.</p>
      )}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  )
}
