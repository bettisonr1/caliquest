'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, MapPin } from 'lucide-react'
import { addGymAction, checkNearbyDuplicatesAction } from '@/app/(app)/gyms/actions'
import { GymMap } from './GymMap'
import type { GymEquipment, NearbyGym } from '@/types/database'

const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }

export const EQUIPMENT_OPTIONS: { key: keyof GymEquipment; label: string }[] = [
  { key: 'horizontal_bar', label: 'Horizontal bar' },
  { key: 'parallel_bars',  label: 'Parallel bars'  },
  { key: 'rings',          label: 'Rings'          },
  { key: 'wall_bars',      label: 'Wall bars'      },
  { key: 'push_up_bars',   label: 'Push-up bars'   },
]

export function AddGymForm() {
  const router = useRouter()
  const [position, setPosition] = useState(DEFAULT_CENTER)
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<GymEquipment>({})
  const [duplicates, setDuplicates] = useState<NearbyGym[]>([])
  // Keyed to the position it was confirmed at, so moving the pin after
  // confirming automatically requires reconfirmation — no reset effect needed.
  const [confirmedAt, setConfirmedAt] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await checkNearbyDuplicatesAction(position.lat, position.lng)
        if (result.ok) setDuplicates(result.data)
      })
    }, 400)
    return () => clearTimeout(timeout)
  }, [position.lat, position.lng])

  function toggleEquipment(key: keyof GymEquipment) {
    setEquipment(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const confirmedNew = confirmedAt?.lat === position.lat && confirmedAt?.lng === position.lng
  const needsConfirmation = duplicates.length > 0 && !confirmedNew

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await addGymAction({
        name: name.trim() || null,
        lat: position.lat,
        lng: position.lng,
        equipment,
      })
      if (result.ok === false) {
        setError(result.error)
      } else {
        router.push(`/gyms/${result.data.gymId}`)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Add a gym</h1>
        <p className="text-gray-400 text-sm mt-1">
          Drop a pin where the bars are — you can drag it or tap the map to adjust.
        </p>
      </div>

      <div className="-mx-4 md:mx-0">
        <div className="h-[35vh] md:rounded-2xl overflow-hidden bg-gray-900">
          <GymMap
            center={position}
            pickerPosition={position}
            onPick={(lat, lng) => setPosition({ lat, lng })}
          />
        </div>
      </div>

      {duplicates.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-yellow-300">Is this the same gym?</p>
              <p className="text-xs text-yellow-300/80 mt-0.5">
                There{duplicates.length === 1 ? "'s" : ' are'} already {duplicates.length} gym
                {duplicates.length === 1 ? '' : 's'} nearby:
              </p>
              <ul className="mt-2 space-y-1">
                {duplicates.map(d => (
                  <li key={d.id}>
                    <Link
                      href={`/gyms/${d.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-sm text-yellow-200 underline hover:text-yellow-100"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {d.name ?? `Spot near ${d.lat.toFixed(3)}, ${d.lng.toFixed(3)}`}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setConfirmedAt(position)}
                className="mt-3 px-3 py-2 -my-1 rounded-lg bg-yellow-500/20 text-yellow-200 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
              >
                No, this is a new gym
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <div>
          <label htmlFor="gym-name" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Name (optional)
          </label>
          <input
            id="gym-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Riverside Park Calisthenics"
            maxLength={80}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Equipment</p>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800 text-sm text-gray-200 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(equipment[key])}
                  onChange={() => toggleEquipment(key)}
                  className="h-4 w-4 accent-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={isPending || needsConfirmation}
          className="w-full py-3 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Add gym'}
        </button>
        {needsConfirmation && (
          <p className="text-xs text-gray-500 text-center">
            Confirm this is a new gym above before adding it.
          </p>
        )}
      </div>
    </div>
  )
}
