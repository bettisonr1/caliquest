'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createCompetitionAction } from '@/app/(app)/competitions/actions'
import { GymTagPicker } from '@/components/gyms/GymTagPicker'
import type { CompetitionSkillLevel } from '@/types/database'

const SKILL_LEVELS: { value: CompetitionSkillLevel; label: string }[] = [
  { value: 'open',         label: 'Open to all'  },
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced'     },
]

const CURRENCIES = ['GBP', 'USD', 'EUR']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

type Props = {
  // Set when arriving from a gym's "Add competition" CTA — pre-fills and
  // locks the gym field instead of showing the GymTagPicker.
  initialGym?: { id: string; name: string | null } | null
}

export function CompetitionForm({ initialGym = null }: Props) {
  const router = useRouter()
  const [gymId, setGymId] = useState<string | null>(initialGym?.id ?? null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const [skillLevel, setSkillLevel] = useState<CompetitionSkillLevel>('open')
  const [capacity, setCapacity] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [currency, setCurrency] = useState('GBP')
  const [externalUrl, setExternalUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file later
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please pick an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 5MB.')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not signed in.')
        return
      }
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('competition-images').upload(path, file)
      if (uploadError) {
        setError('Could not upload image. Please try again.')
        return
      }
      const { data } = supabase.storage.from('competition-images').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  // datetime-local inputs have no timezone of their own — Date() parses
  // them as local time in whatever environment evaluates it. Converting to
  // an ISO string here (in the browser, where "local" correctly means the
  // organizer's own timezone) before it ever reaches the server action
  // avoids a UTC server re-interpreting the same string as a different
  // instant.
  function toIso(localValue: string): string | null {
    if (!localValue) return null
    const date = new Date(localValue)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  function submit() {
    setError(null)

    if (!gymId) {
      setError('Pick which gym this competition is at.')
      return
    }
    const startIso = toIso(startAt)
    if (!startIso) {
      setError('Pick a start date and time.')
      return
    }

    const capacityValue = capacity.trim() === '' ? null : Number.parseInt(capacity, 10)
    if (capacityValue !== null && !Number.isInteger(capacityValue)) {
      setError('Capacity must be a whole number.')
      return
    }

    const feeMajorUnits = entryFee.trim() === '' ? null : Number.parseFloat(entryFee)
    if (feeMajorUnits !== null && Number.isNaN(feeMajorUnits)) {
      setError('Entry fee must be a number.')
      return
    }

    startTransition(async () => {
      const result = await createCompetitionAction({
        gym_id: gymId,
        name,
        description: description.trim() || null,
        image_url: imageUrl,
        start_at: startIso,
        end_at: toIso(endAt),
        registration_deadline: toIso(registrationDeadline),
        skill_level: skillLevel,
        capacity: capacityValue,
        entry_fee_minor_units: feeMajorUnits === null ? null : Math.round(feeMajorUnits * 100),
        currency,
        external_registration_url: externalUrl.trim() || null,
      })
      if (result.ok === false) {
        setError(result.error)
      } else {
        router.push(`/competitions/${result.data.competitionId}`)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Add a competition</h1>
        <p className="text-gray-400 text-sm mt-1">Post an event at a gym for others to compete in or attend.</p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        {initialGym ? (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Gym</p>
            <p className="text-sm text-white">{initialGym.name ?? 'This spot'}</p>
          </div>
        ) : (
          <GymTagPicker onSelect={setGymId} required />
        )}

        <div>
          <label htmlFor="competition-name" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Name
          </label>
          <input
            id="competition-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Riverside Pull-Up Jam"
            maxLength={100}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Image (optional)</p>
          {imageUrl ? (
            <div className="relative h-36 w-full rounded-lg overflow-hidden bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element -- freshly-uploaded Storage URL, form preview only */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 h-11 w-11 flex items-center justify-center rounded-full bg-gray-950/80 text-white hover:bg-gray-950 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 h-24 rounded-lg border border-dashed border-gray-700 text-sm text-gray-400 cursor-pointer hover:border-gray-600 transition-colors">
              {uploading ? (
                'Uploading…'
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  Add a photo
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImagePick} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>

        <div>
          <label htmlFor="competition-description" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Description (optional)
          </label>
          <textarea
            id="competition-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Format, categories, what to bring…"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="competition-start" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Starts
            </label>
            <input
              id="competition-start"
              type="datetime-local"
              value={startAt}
              onChange={e => setStartAt(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="competition-end" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Ends (optional)
            </label>
            <input
              id="competition-end"
              type="datetime-local"
              value={endAt}
              onChange={e => setEndAt(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="competition-deadline" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Registration deadline (optional)
          </label>
          <input
            id="competition-deadline"
            type="datetime-local"
            value={registrationDeadline}
            onChange={e => setRegistrationDeadline(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Skill level</p>
          <div className="grid grid-cols-2 gap-2">
            {SKILL_LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSkillLevel(value)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  skillLevel === value
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gray-800 text-gray-300 border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="competition-capacity" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Competitor capacity (optional)
            </label>
            <input
              id="competition-capacity"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              inputMode="numeric"
              placeholder="Unlimited"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">Extra signups to compete go on a waitlist. Attending is never capped.</p>
          </div>
          <div>
            <label htmlFor="competition-fee" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Entry fee (optional)
            </label>
            <div className="flex gap-2">
              <input
                id="competition-fee"
                value={entryFee}
                onChange={e => setEntryFee(e.target.value)}
                inputMode="decimal"
                placeholder="Free"
                className="min-w-0 flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="rounded-lg bg-gray-800 border border-gray-700 px-2 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="competition-external-url" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            External registration link (optional)
          </label>
          <input
            id="competition-external-url"
            type="url"
            value={externalUrl}
            onChange={e => setExternalUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={isPending || uploading}
          className="w-full py-3 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Add competition'}
        </button>
      </div>
    </div>
  )
}
