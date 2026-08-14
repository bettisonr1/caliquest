'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { getNearestGymAction, getRecentGymsAction, searchGymsAction } from '@/app/(app)/gyms/actions'
import type { GymSearchResult, NearbyGym } from '@/types/database'

type SuggestedGym = { id: string; name: string | null }

// Where a user trained — tag a workout to a gym so it counts toward that
// gym's passport, leaderboard and renown. Three ways in, cheapest first:
// a one-tap nearby suggestion (geolocation), a recent-gyms shortlist (their
// own tagging history), and a name search as the always-available
// fallback. None of these ever block workout logging — any failure just
// means fewer suggestions.
export function GymTagPicker({ onSelect }: { onSelect: (gymId: string | null) => void }) {
  const [nearest, setNearest] = useState<NearbyGym | null>(null)
  const [recent, setRecent] = useState<SuggestedGym[]>([])
  const [selected, setSelected] = useState<SuggestedGym | null>(null)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GymSearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        getNearestGymAction(pos.coords.latitude, pos.coords.longitude)
          .then(result => {
            if (result.ok && result.data) setNearest(result.data)
          })
          .catch(() => {})
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    )
  }, [])

  useEffect(() => {
    getRecentGymsAction()
      .then(result => {
        if (result.ok) setRecent(result.data)
      })
      .catch(() => {})
  }, [])

  // Mirrors GymsExplorer's search debounce: a too-short query just skips
  // the fetch (no setState here) rather than clearing `results` — the
  // render below only shows results once the query is long enough, so
  // stale results sitting in state are never visible.
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchGymsAction(trimmed)
        if (result.ok) setResults(result.data)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  function select(gym: SuggestedGym | null) {
    setSelected(gym)
    setSearching(false)
    setQuery('')
    setResults([])
    onSelect(gym?.id ?? null)
  }

  function openSearch() {
    setSearching(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function closeSearch() {
    setSearching(false)
    setQuery('')
    setResults([])
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Tag a gym <span className="normal-case font-normal">(optional)</span>
      </p>

      {selected ? (
        <button
          onClick={() => select(null)}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 -my-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition-colors"
        >
          <MapPin className="h-3.5 w-3.5" />
          Training at {selected.name ?? 'this spot'}
          <X className="h-3.5 w-3.5" />
        </button>
      ) : searching ? (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search gyms by name…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-9 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={closeSearch}
              aria-label="Cancel search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 -m-1 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {query.trim().length >= 2 && (
            <ul className="mt-1 max-h-40 overflow-y-auto">
              {results.map(g => (
                <li key={g.id}>
                  <button
                    onClick={() => select(g)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{g.name ?? 'Unnamed spot'}</span>
                  </button>
                </li>
              ))}
              {results.length === 0 && !isPending && (
                <li className="px-3 py-2 text-xs text-gray-500">No gyms match that name.</li>
              )}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto -mx-0.5 px-0.5">
          {[nearest, ...recent.filter(g => g.id !== nearest?.id)]
            .filter((g): g is SuggestedGym => g !== null)
            .map(g => (
              <button
                key={g.id}
                onClick={() => select(g)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 -my-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                {g.name ?? 'this spot'}
              </button>
            ))}
          <button
            onClick={openSearch}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 -my-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Find a gym
          </button>
        </div>
      )}
    </div>
  )
}
