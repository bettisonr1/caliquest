'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { ChevronDown, LocateFixed, MapPin, Plus, Search } from 'lucide-react'
import { getNearbyGymsAction, searchGymsAction } from '@/app/(app)/gyms/actions'
import { GymMap } from './GymMap'
import { OsmAttribution } from './OsmAttribution'
import type { GymSearchResult, GymStatus, NearbyGym } from '@/types/database'

// Central London — a reasonable default center when geolocation is denied
// or unavailable (the OSM import's first region is the UK).
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }

function statusColor(status: GymStatus): string {
  return status === 'verified' ? '#34d399' : '#9ca3af'
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function gymDisplayName(name: string | null, lat: number, lng: number): string {
  return name ?? `Spot near ${lat.toFixed(3)}, ${lng.toFixed(3)}`
}

type GeoState = 'pending' | 'granted' | 'denied' | 'unavailable'

function hasGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

// Gyms near the user (distance-sorted, from `nearby`) plus anything
// discovered by panning the map (`viewportGyms`), deduped by id. The
// near-you gyms keep their real distance and lead the list; anything only
// found by exploring the map is appended after with no distance badge,
// same convention as name search results.
function mergeGymLists(
  nearby: NearbyGym[],
  viewportGyms: NearbyGym[]
): Array<GymSearchResult & { distanceM: number | null }> {
  const seen = new Set(nearby.map(g => g.id))
  const fromNearby = nearby.map(g => ({ ...g, distanceM: g.distance_m as number | null }))
  const fromViewport = viewportGyms
    .filter(g => !seen.has(g.id))
    .map(g => ({ ...g, distanceM: null as number | null }))
  return [...fromNearby, ...fromViewport]
}

export function GymsExplorer() {
  // Always starts 'pending' — the server has no navigator to check, so
  // deriving this from hasGeolocation() at init would mismatch on hydration
  // (server always sees no navigator, client sometimes does).
  const [geoState, setGeoState] = useState<GeoState>('pending')
  // Two separate centers on purpose: userLocation is the distance-calculation
  // origin (only ever set from a real geolocation fix) and mapCenter is just
  // where the map is currently panned to. Selecting a gym used to overwrite
  // a single shared `center`, which silently re-sorted the whole nearby list
  // around whatever gym you tapped — mapCenter is safe to move freely without
  // that side effect.
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [nearby, setNearby] = useState<NearbyGym[]>([])
  // Gyms loaded around wherever the user last panned the map to, on top of
  // `nearby` — lets the map/list surface spots outside the user's own
  // vicinity as they explore, without disturbing the distance-from-you
  // sort of `nearby` itself.
  const [viewportGyms, setViewportGyms] = useState<NearbyGym[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GymSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // The gyms list starts collapsed so the map gets the screen by default —
  // it opens on demand (tapping the handle, or selecting a gym).
  const [sheetOpen, setSheetOpen] = useState(false)
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map())
  const viewportFetchIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    function onFix(coords: { lat: number; lng: number }) {
      if (cancelled) return
      setUserLocation(coords)
      setMapCenter(coords)
      setGeoState('granted')
    }

    function onFail() {
      if (!cancelled) setGeoState('denied')
    }

    // The iOS app runs inside a Capacitor WKWebView, where navigator.geolocation
    // is present but non-functional — it isn't backed by native CoreLocation
    // permissions. Native platforms have to go through the Capacitor plugin
    // instead; navigator.geolocation stays the path for the web build.
    if (Capacitor.isNativePlatform()) {
      Geolocation.requestPermissions({ permissions: ['location'] })
        .then(perms => {
          if (cancelled) return
          if (perms.location !== 'granted') {
            setGeoState('denied')
            return
          }
          return Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 }).then(
            pos => onFix({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          )
        })
        .catch(onFail)
      return () => {
        cancelled = true
      }
    }

    if (!hasGeolocation()) {
      // Must run post-hydration (see the geoState comment above) rather than
      // being derived at init, so this one synchronous setState is required.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeoState('unavailable')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => onFix({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      onFail,
      { enableHighAccuracy: false, timeout: 8000 }
    )
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    startTransition(async () => {
      const result = await getNearbyGymsAction(userLocation.lat, userLocation.lng)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setNearby(result.data)
        setError(null)
      }
    })
  }, [userLocation.lat, userLocation.lng])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchGymsAction(trimmed)
        if (result.ok) setSearchResults(result.data)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  // Selecting a gym on the map (or via the list itself) should bring its
  // row into view centered in the scrollable list — otherwise picking a
  // marker off-screen leaves the matching row scrolled out of sight.
  useEffect(() => {
    if (!selectedId) return
    const el = listItemRefs.current.get(selectedId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedId])

  const showingSearch = query.trim().length >= 2
  const effectiveSearchResults = showingSearch ? searchResults : []

  // Normalize both list sources to one shape up front, computed separately
  // per source array (rather than narrowing a NearbyGym | GymSearchResult
  // union per item) so distance stays a plain number | null everywhere else.
  const listItems = showingSearch
    ? effectiveSearchResults.map(g => ({ ...g, distanceM: null as number | null }))
    : mergeGymLists(nearby, viewportGyms)

  const markers = useMemo(
    () =>
      listItems.map(g => ({
        id: g.id,
        lat: g.lat,
        lng: g.lng,
        color: statusColor(g.status),
      })),
    [listItems]
  )

  // Fires when the user finishes dragging/zooming the map — loads gyms
  // around the new spot so pins (and the list) fill in as they explore,
  // not just around their own location. Guarded against out-of-order
  // responses since a fast pan can start a new fetch before an older one
  // resolves, and skipped entirely while a name search is active since
  // that already drives its own result set.
  function handleMapMoveEnd(newCenter: { lat: number; lng: number }) {
    if (showingSearch) return
    const fetchId = ++viewportFetchIdRef.current
    startTransition(async () => {
      const result = await getNearbyGymsAction(newCenter.lat, newCenter.lng)
      if (fetchId !== viewportFetchIdRef.current) return
      if (result.ok) setViewportGyms(result.data)
    })
  }

  function selectGym(gym: { id: string; lat: number; lng: number }) {
    setSelectedId(gym.id)
    setMapCenter({ lat: gym.lat, lng: gym.lng })
    setSheetOpen(true)
  }

  function recenterOnMe() {
    setMapCenter(userLocation)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Gyms</h1>
          <p className="text-gray-400 text-sm mt-1">Find outdoor bars near you.</p>
        </div>
        <Link
          href="/gyms/add"
          className="flex items-center gap-1.5 px-3 py-2.5 -my-0.5 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add gym
        </Link>
      </div>

      {/* Full-bleed map on mobile — see SkillsTree for the same edge-bleed pattern */}
      <div className="-mx-4 md:mx-0">
        <div className="relative h-[45vh] md:h-[55vh] md:rounded-2xl overflow-hidden bg-gray-900">
          <GymMap
            center={mapCenter}
            markers={markers}
            selectedId={selectedId}
            onMarkerClick={id => {
              setSelectedId(id)
              setSheetOpen(true)
            }}
            youAreHere={geoState === 'granted' ? userLocation : null}
            onMoveEnd={handleMapMoveEnd}
          />
          {geoState === 'granted' && (
            <button
              onClick={recenterOnMe}
              aria-label="Recenter on my location"
              className="absolute bottom-3 left-3 flex items-center justify-center h-11 w-11 rounded-full bg-gray-900/90 border border-gray-700 text-emerald-400 shadow-lg hover:bg-gray-800 transition-colors"
            >
              <LocateFixed className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* In-flow "bottom sheet" — visually overlaps the map but stays in
          normal document flow so it composes safely with the fixed bottom
          nav's pb-24 (see CLAUDE.md) instead of needing its own fixed
          positioning + safe-area math. Collapsed by default (just the
          handle bar below) so the map gets the screen on first load. */}
      <div className="relative -mt-5 mx-4 md:mx-0 rounded-t-2xl md:rounded-2xl md:mt-4 border border-gray-800 bg-gray-900 shadow-xl">
        <button
          onClick={() => setSheetOpen(o => !o)}
          aria-expanded={sheetOpen}
          className="w-full flex flex-col items-center gap-1.5 pt-2 pb-2.5 min-h-11"
        >
          <span className="h-1 w-10 rounded-full bg-gray-700 md:hidden" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            {sheetOpen ? 'Hide list' : `Show list${listItems.length > 0 ? ` · ${listItems.length} gyms` : ''}`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sheetOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {sheetOpen && (
          <div className="px-4 pb-4 pt-1">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search gyms by name…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {geoState === 'denied' && !showingSearch && (
              <p className="mb-3 text-xs text-yellow-400/90">
                Location access denied — showing gyms near London. Search by name or browse the map.
              </p>
            )}
            {geoState === 'unavailable' && !showingSearch && (
              <p className="mb-3 text-xs text-yellow-400/90">
                Location isn&apos;t available on this device — showing gyms near London.
              </p>
            )}
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            <ul className="space-y-1 max-h-[40vh] overflow-y-auto -mx-1 px-1">
              {listItems.map(gym => (
                <li
                  key={gym.id}
                  ref={el => {
                    if (el) listItemRefs.current.set(gym.id, el)
                    else listItemRefs.current.delete(gym.id)
                  }}
                >
                  <button
                    onClick={() => selectGym(gym)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg text-left transition-colors ${
                      selectedId === gym.id ? 'bg-gray-800' : 'hover:bg-gray-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MapPin
                        className="h-4 w-4 shrink-0"
                        style={{ color: statusColor(gym.status) }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-white truncate">
                          {gymDisplayName(gym.name, gym.lat, gym.lng)}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {gym.status === 'unverified' ? 'Rumored Spot' : 'Verified'}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      {gym.distanceM !== null && (
                        <span className="text-xs text-gray-400">{formatDistance(gym.distanceM)}</span>
                      )}
                      <Link
                        href={`/gyms/${gym.id}${gym.distanceM !== null ? `?distance_m=${Math.round(gym.distanceM)}` : ''}`}
                        className="p-2.5 -m-2.5 text-emerald-400 text-xs font-semibold hover:text-emerald-300"
                        onClick={e => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </span>
                  </button>
                </li>
              ))}
              {listItems.length === 0 && !isPending && (
                <li className="px-3 py-6 text-center text-sm text-gray-500">
                  {showingSearch ? 'No gyms match that name.' : 'No gyms found nearby yet — add one!'}
                </li>
              )}
            </ul>

            <div className="mt-3 pt-3 border-t border-gray-800">
              <OsmAttribution />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
