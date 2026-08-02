'use client'

import { useState, useTransition } from 'react'
import { toggleFistBumpAction } from '@/app/(app)/profile/actions'

// Toggleable fist-bump on a friend's workout. Optimistic: flips immediately,
// reverts if the server action fails.
export function FistBumpButton({
  workoutId,
  initialCount,
  initialBumped,
}: {
  workoutId:     string
  initialCount:  number
  initialBumped: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [bumped, setBumped] = useState(initialBumped)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function toggle() {
    const prevCount = count
    const prevBumped = bumped
    setError(null)
    setBumped(!prevBumped)
    setCount(prevCount + (prevBumped ? -1 : 1))
    startTransition(async () => {
      const result = await toggleFistBumpAction(workoutId)
      if (result.ok === false) {
        setBumped(prevBumped)
        setCount(prevCount)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        aria-pressed={bumped}
        aria-label={bumped ? 'Remove fist bump' : 'Give a fist bump'}
        className={`flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border text-sm font-semibold transition-colors ${
          bumped
            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
            : 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-600 hover:text-white'
        }`}
      >
        <span className="text-base leading-none">🤜</span>
        {count > 0 && <span>{count}</span>}
        <span className="text-xs font-medium">{bumped ? 'Bumped' : 'Fist bump'}</span>
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
