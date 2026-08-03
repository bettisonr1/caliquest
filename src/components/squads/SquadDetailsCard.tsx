'use client'

import { useState, useTransition } from 'react'
import { MapPin, Pencil } from 'lucide-react'
import { updateSquadAction } from '@/app/(app)/squads/actions'
import type { Squad } from '@/types/database'

export function SquadDetailsCard({ squad, canEdit }: { squad: Squad; canEdit: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(squad.name)
  const [gymName, setGymName] = useState(squad.gym_name ?? '')
  const [meetingInfo, setMeetingInfo] = useState(squad.meeting_info ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateSquadAction(squad.id, {
        name,
        gym_name: gymName,
        meeting_info: meetingInfo,
      })
      if (result.ok === false) {
        setError(result.error)
        return
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-3">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          placeholder="Squad name"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          value={gymName}
          onChange={e => setGymName(e.target.value)}
          maxLength={300}
          placeholder="Gym or spot"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          value={meetingInfo}
          onChange={e => setMeetingInfo(e.target.value)}
          maxLength={300}
          placeholder="Meeting times"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={isPending || name.trim() === ''}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">{squad.name}</h1>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit squad details"
            className="h-9 w-9 -my-1 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
      {(squad.gym_name || squad.meeting_info) && (
        <div className="mt-2 space-y-1 text-sm text-gray-400">
          {squad.gym_name && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {squad.gym_name}
            </p>
          )}
          {squad.meeting_info && <p>{squad.meeting_info}</p>}
        </div>
      )}
    </div>
  )
}
