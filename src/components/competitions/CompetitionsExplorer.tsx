'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import {
  getMyCompetitionsAction,
  getNearbyCompetitionsAction,
  searchCompetitionsAction,
} from '@/app/(app)/competitions/actions'
import { CompetitionCard } from './CompetitionCard'
import type { Competition, CompetitionIntent, CompetitionSearchResult, NearbyCompetition } from '@/types/database'

// Central London — same fallback used by GymsExplorer (the OSM import's
// first region is the UK) when geolocation is denied or unavailable.
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }

type GeoState = 'pending' | 'granted' | 'denied' | 'unavailable'

function hasGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

function intentBadge(intent: CompetitionIntent): string {
  return intent === 'competing' ? 'Competing' : 'Attending'
}

type Tab = 'nearby' | 'mine'

export function CompetitionsExplorer() {
  const [geoState, setGeoState] = useState<GeoState>('pending')
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER)
  const [tab, setTab] = useState<Tab>('nearby')
  const [nearby, setNearby] = useState<NearbyCompetition[]>([])
  const [mine, setMine] = useState<(Competition & { intent: CompetitionIntent })[]>([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CompetitionSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!hasGeolocation()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeoState('unavailable')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoState('granted')
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    startTransition(async () => {
      const result = await getNearbyCompetitionsAction(userLocation.lat, userLocation.lng)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setNearby(result.data)
        setError(null)
      }
    })
  }, [userLocation.lat, userLocation.lng])

  useEffect(() => {
    if (tab !== 'mine' || mine.length > 0) return
    startTransition(async () => {
      const result = await getMyCompetitionsAction()
      if (result.ok) setMine(result.data)
    })
  }, [tab, mine.length])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchCompetitionsAction(trimmed)
        if (result.ok) setSearchResults(result.data)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const showingSearch = query.trim().length >= 2
  const listItems = showingSearch
    ? searchResults
    : tab === 'mine'
      ? mine
      : nearby

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Competitions</h1>
          <p className="text-gray-400 text-sm mt-1">Register to compete, or come along to support.</p>
        </div>
        <Link
          href="/competitions/add"
          className="flex items-center gap-1.5 px-3 py-2.5 -my-0.5 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search competitions by name…"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {!showingSearch && (
        <div className="flex gap-1 rounded-lg bg-gray-900 border border-gray-800 p-1">
          <button
            onClick={() => setTab('nearby')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === 'nearby' ? 'bg-gray-800 text-white' : 'text-gray-400'
            }`}
          >
            Near you
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === 'mine' ? 'bg-gray-800 text-white' : 'text-gray-400'
            }`}
          >
            Mine
          </button>
        </div>
      )}

      {!showingSearch && tab === 'nearby' && geoState === 'denied' && (
        <p className="text-xs text-yellow-400/90">
          Location access denied — showing competitions near London. Search by name instead.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-2">
        {listItems.length === 0 && !isPending && (
          <p className="text-sm text-gray-500 text-center py-8">
            {showingSearch
              ? 'No competitions match that name.'
              : tab === 'mine'
                ? "You haven't registered for or joined any competitions yet."
                : 'No upcoming competitions nearby.'}
          </p>
        )}
        {listItems.map(c => (
          <CompetitionCard
            key={c.id}
            id={c.id}
            name={c.name}
            imageUrl={c.image_url}
            startAt={c.start_at}
            gymName={'gym_name' in c ? c.gym_name : null}
            distanceM={'distance_m' in c ? c.distance_m : null}
            badge={'intent' in c ? intentBadge(c.intent) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
