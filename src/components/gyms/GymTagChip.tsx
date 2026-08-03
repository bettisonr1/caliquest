'use client'

import { useEffect, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { getNearestGymAction } from '@/app/(app)/gyms/actions'
import type { NearbyGym } from '@/types/database'

// A one-tap "where are you training?" suggestion — never blocks workout
// logging, so any failure (denied location, no nearby gym, request error)
// just means the chip doesn't appear.
export function GymTagChip({ onSelect }: { onSelect: (gymId: string | null) => void }) {
  const [gym, setGym] = useState<NearbyGym | null>(null)
  const [selected, setSelected] = useState(false)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        getNearestGymAction(pos.coords.latitude, pos.coords.longitude)
          .then(result => {
            if (result.ok && result.data) setGym(result.data)
          })
          .catch(() => {})
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    )
  }, [])

  function toggle() {
    if (!gym) return
    const next = !selected
    setSelected(next)
    onSelect(next ? gym.id : null)
  }

  if (!gym) return null

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-2.5 -my-0.5 rounded-full text-xs font-semibold transition-colors ${
        selected
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
      }`}
    >
      <MapPin className="h-3.5 w-3.5" />
      {selected ? `Training at ${gym.name ?? 'this spot'}` : `Training at ${gym.name ?? 'this spot'}?`}
      {selected && <X className="h-3.5 w-3.5" />}
    </button>
  )
}
