'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelCompetitionAction } from '@/app/(app)/competitions/actions'

export function CancelCompetitionButton({ competitionId }: { competitionId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function cancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelCompetitionAction(competitionId)
      if (result.ok === false) setError(result.error)
      else router.refresh()
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors py-2 -my-1"
      >
        Cancel this competition
      </button>
    )
  }

  return (
    <div className="text-right">
      <p className="text-xs text-gray-400 mb-1.5">Cancel this competition for everyone?</p>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs font-semibold text-gray-400 py-2 -my-1 disabled:opacity-50"
        >
          Never mind
        </button>
        <button
          onClick={cancel}
          disabled={isPending}
          className="text-xs font-semibold text-red-400 py-2 -my-1 disabled:opacity-50"
        >
          {isPending ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
