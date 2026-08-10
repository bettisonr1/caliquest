'use client'

import { useState, useTransition } from 'react'
import { Pencil, ThumbsDown, ThumbsUp } from 'lucide-react'
import { adminUpdateGymAction, proposeSuggestionAction, voteOnSuggestionAction } from '@/app/(app)/gyms/actions'
import { EQUIPMENT_OPTIONS } from './AddGymForm'
import { CONTRIBUTOR_POINTS_PER_ACCEPTED_SUGGESTION, SUGGESTION_APPROVE_THRESHOLD } from '@/lib/gym-suggestions'
import type { Gym, GymEquipment, GymSuggestionField, GymSuggestionWithVotes } from '@/types/database'

function humanizeEquipmentKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

type Props = {
  gymId: string
  gym: Gym
  suggestions: GymSuggestionWithVotes[]
  viewerId: string
  // Admins edit name/equipment directly (adminUpdateGymAction) instead of
  // going through the suggest-and-vote flow below — see gyms.service.ts.
  isAdmin: boolean
}

export function GymSuggestions({ gymId, gym, suggestions, viewerId, isAdmin }: Props) {
  const [openField, setOpenField] = useState<GymSuggestionField | null>(null)
  const [nameValue, setNameValue] = useState('')
  const [equipmentValue, setEquipmentValue] = useState<GymEquipment>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const pendingName = suggestions.find(s => s.field === 'name') ?? null
  const pendingEquipment = suggestions.find(s => s.field === 'equipment') ?? null
  // Only equipment the gym doesn't already have is worth suggesting — an
  // accepted suggestion merges into the existing equipment jsonb rather
  // than replacing it, so this is strictly additive. Admins edit directly,
  // so they see (and can toggle off) everything, not just what's missing.
  const missingEquipment = EQUIPMENT_OPTIONS.filter(({ key }) => !gym.equipment[key])
  const equipmentOptions = isAdmin ? EQUIPMENT_OPTIONS : missingEquipment

  function openForm(field: GymSuggestionField) {
    setOpenField(field)
    setError(null)
    if (isAdmin) {
      if (field === 'name') setNameValue(gym.name ?? '')
      if (field === 'equipment') setEquipmentValue({ ...gym.equipment })
    }
  }

  function closeForm() {
    setOpenField(null)
    setError(null)
  }

  function toggleEquipment(key: keyof GymEquipment) {
    setEquipmentValue(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function submitName() {
    const trimmed = nameValue.trim()
    if (!trimmed) {
      setError('Enter a name first.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = isAdmin
        ? await adminUpdateGymAction(gymId, { name: trimmed })
        : await proposeSuggestionAction(gymId, 'name', trimmed)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setOpenField(null)
        setNameValue('')
      }
    })
  }

  function submitEquipment() {
    // Admins replace the gym's equipment outright (so unchecking an item
    // removes it); a community suggestion only ever adds what's checked.
    const payload = isAdmin
      ? Object.fromEntries(EQUIPMENT_OPTIONS.map(({ key }) => [key, Boolean(equipmentValue[key])]))
      : Object.fromEntries(Object.entries(equipmentValue).filter(([, v]) => v))
    if (!isAdmin && Object.keys(payload).length === 0) {
      setError('Pick at least one item.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = isAdmin
        ? await adminUpdateGymAction(gymId, { equipment: payload })
        : await proposeSuggestionAction(gymId, 'equipment', payload)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setOpenField(null)
        setEquipmentValue({})
      }
    })
  }

  function vote(suggestionId: string, value: 'approve' | 'reject') {
    setError(null)
    startTransition(async () => {
      const result = await voteOnSuggestionAction(gymId, suggestionId, value)
      if (result.ok === false) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Suggested edits</h2>

      {suggestions.length > 0 && (
        <ul className="space-y-4 mb-4">
          {suggestions.map(s => {
            const isSuggester = s.suggested_by === viewerId
            const hasVoted = s.viewerVote !== null
            const disabled = isPending || isSuggester || hasVoted
            const pct = Math.min(100, Math.round((s.approveCount / SUGGESTION_APPROVE_THRESHOLD) * 100))

            return (
              <li key={s.id} className="pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                <p className="text-sm text-white">
                  {s.field === 'name' ? (
                    <>
                      Rename {gym.name ? `“${gym.name}”` : 'this gym'} to{' '}
                      <span className="font-semibold">“{(s.proposed_value as { value: string }).value}”</span>
                    </>
                  ) : (
                    <>
                      Add{' '}
                      <span className="font-semibold">
                        {Object.keys((s.proposed_value as { value: GymEquipment }).value)
                          .map(humanizeEquipmentKey)
                          .join(', ')}
                      </span>
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {s.approveCount}/{SUGGESTION_APPROVE_THRESHOLD}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2.5">
                  <button
                    onClick={() => vote(s.id, 'approve')}
                    disabled={disabled}
                    aria-label="Approve suggestion"
                    aria-pressed={s.viewerVote === 'approve'}
                    className={`p-2.5 -m-2.5 rounded-lg transition-colors disabled:opacity-40 ${
                      s.viewerVote === 'approve' ? 'text-emerald-400' : 'text-gray-400 hover:text-emerald-400'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => vote(s.id, 'reject')}
                    disabled={disabled}
                    aria-label="Reject suggestion"
                    aria-pressed={s.viewerVote === 'reject'}
                    className={`p-2.5 -m-2.5 rounded-lg transition-colors disabled:opacity-40 ${
                      s.viewerVote === 'reject' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  {isSuggester ? (
                    <span className="text-xs text-gray-500">Your suggestion</span>
                  ) : hasVoted ? (
                    <span className="text-xs text-gray-500">You voted {s.viewerVote}</span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Name edit — direct save for admins, suggest-and-vote otherwise */}
      {openField === 'name' ? (
        <div className="space-y-2 mb-3">
          <label
            htmlFor="suggest-gym-name"
            className="block text-xs font-semibold text-gray-400 uppercase tracking-widest"
          >
            {isAdmin ? 'Gym name' : 'Suggested name'}
          </label>
          <input
            id="suggest-gym-name"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            maxLength={80}
            placeholder={gym.name ?? 'e.g. Riverside Park Calisthenics'}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2">
            <button
              onClick={submitName}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : isAdmin ? 'Save' : 'Submit suggestion'}
            </button>
            <button
              onClick={closeForm}
              className="px-3 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-semibold hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : !isAdmin && pendingName ? (
        <p className="text-xs text-gray-500 mb-3">
          There&apos;s already a pending name suggestion above — vote on it instead of proposing another.
        </p>
      ) : (
        <button
          onClick={() => openForm('name')}
          className="flex items-center gap-1.5 py-2.5 -my-2.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> {isAdmin ? 'Edit name' : 'Suggest a name edit'}
        </button>
      )}

      {/* Equipment edit — direct save for admins, suggest-and-vote otherwise */}
      {openField === 'equipment' ? (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {isAdmin ? 'Equipment' : 'Equipment to add'}
          </p>
          {equipmentOptions.length === 0 ? (
            <p className="text-sm text-gray-500">Every equipment type is already marked on this gym.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {equipmentOptions.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800 text-sm text-gray-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(equipmentValue[key])}
                    onChange={() => toggleEquipment(key)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={submitEquipment}
              disabled={isPending || (!isAdmin && equipmentOptions.length === 0)}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : isAdmin ? 'Save' : 'Submit suggestion'}
            </button>
            <button
              onClick={closeForm}
              className="px-3 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-semibold hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : !isAdmin && pendingEquipment ? (
        <p className="text-xs text-gray-500 mt-3">
          There&apos;s already a pending equipment suggestion above — vote on it instead of proposing another.
        </p>
      ) : equipmentOptions.length > 0 ? (
        <button
          onClick={() => openForm('equipment')}
          className="flex items-center gap-1.5 py-2.5 -my-2.5 mt-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> {isAdmin ? 'Edit equipment' : 'Suggest an equipment edit'}
        </button>
      ) : null}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {!isAdmin && (
        <p className="mt-4 text-xs text-gray-600">
          Accepted suggestions earn the suggester +{CONTRIBUTOR_POINTS_PER_ACCEPTED_SUGGESTION} Contributor Points.
        </p>
      )}
    </div>
  )
}
