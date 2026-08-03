'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createSquadAction } from '@/app/(app)/squads/actions'

export function CreateSquadForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [gymName, setGymName] = useState('')
  const [meetingInfo, setMeetingInfo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createSquadAction({
        name,
        gym_name: gymName,
        meeting_info: meetingInfo,
      })
      if (result.ok === false) {
        setError(result.error)
        return
      }
      router.push(`/squads/${result.squadId}`)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-gray-700 p-4 text-sm font-semibold text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
      >
        <Plus className="h-4 w-4" /> Start a squad
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-3">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">New squad</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Squad name"
        maxLength={60}
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
      />
      <input
        type="text"
        value={gymName}
        onChange={e => setGymName(e.target.value)}
        placeholder="Gym or spot (optional)"
        maxLength={300}
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
      />
      <input
        type="text"
        value={meetingInfo}
        onChange={e => setMeetingInfo(e.target.value)}
        placeholder="Meeting times (optional, e.g. Saturdays 9am)"
        maxLength={300}
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
      />

      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={isPending || name.trim() === ''}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Creating…' : 'Create squad'}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
