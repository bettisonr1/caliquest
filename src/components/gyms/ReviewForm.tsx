'use client'

import { useState, useTransition } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { deleteReviewAction, submitReviewAction } from '@/app/(app)/gyms/actions'

type Props = {
  gymId: string
  existingReview: { rating: number; comment: string | null } | null
}

export function ReviewForm({ gymId, existingReview }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (rating < 1) {
      setError('Pick a star rating first.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitReviewAction(gymId, rating, comment)
      if (result.ok === false) setError(result.error)
    })
  }

  function remove() {
    setError(null)
    startTransition(async () => {
      const result = await deleteReviewAction(gymId)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setRating(0)
        setComment('')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3">
        {existingReview ? 'Your review' : 'Leave a review'}
      </h3>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            className="p-2.5 -m-2.5"
          >
            <Star
              className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        placeholder="How's the setup? Any tips for first-timers?"
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : existingReview ? 'Update review' : 'Post review'}
        </button>
        {existingReview && (
          <button
            onClick={remove}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-semibold hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
