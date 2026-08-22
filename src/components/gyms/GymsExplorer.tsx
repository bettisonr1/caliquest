'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocateFixed, MapPin, Plus, Search, X } from 'lucide-react'
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

function humanizeEquipmentKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

type GeoState = 'pending' | 'granted' | 'denied' | 'unavailable'

function hasGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

// A gym as shown on the map/preview card: NearbyGym or GymSearchResult
// normalized to one shape, computed separately per source array (rather
// than narrowing a union per item) so distance stays a plain
// number | null everywhere else.
type MapGym = GymSearchResult & { distanceM: number | null }

// Gyms near the user (distance-sorted, from `nearby`) plus anything
// discovered by panning the map (`viewportGyms`), deduped by id. The
// near-you gyms keep their real distance and lead the list; anything only
// found by exploring the map is appended after with no distance badge,
// same convention as name search results.
function mergeGymLists(nearby: NearbyGym[], viewportGyms: NearbyGym[]): MapGym[] {
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
  // `nearby` — lets the map surface pins outside the user's own vicinity
  // as they explore, without disturbing the distance-from-you sort of
  // `nearby` itself.
  const [viewportGyms, setViewportGyms] = useState<NearbyGym[]>([])
  // The gym behind the currently-open preview card — the whole object
  // (not just an id) since it's populated straight from whichever marker
  // was tapped, no extra fetch needed.
  const [selectedGym, setSelectedGym] = useState<MapGym | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GymSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
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

  const showingSearch = searchOpen && query.trim().length >= 2

  // What's on the map right now: search matches while actively searching,
  // otherwise everything discovered near the user / by panning.
  const mapGyms: MapGym[] = showingSearch
    ? searchResults.map(g => ({ ...g, distanceM: null as number | null }))
    : mergeGymLists(nearby, viewportGyms)

  const markers = useMemo(
    () =>
      mapGyms.map(g => ({
        id: g.id,
        lat: g.lat,
        lng: g.lng,
        color: statusColor(g.status),
      })),
    [mapGyms]
  )

  // Loads gyms around a point into `viewportGyms`. Guarded against
  // out-of-order responses since a fast pan (or a quick search-result
  // pick right after) can start a new fetch before an older one resolves.
  function loadViewportGyms(center: { lat: number; lng: number }) {
    const fetchId = ++viewportFetchIdRef.current
    startTransition(async () => {
      const result = await getNearbyGymsAction(center.lat, center.lng)
      if (fetchId !== viewportFetchIdRef.current) return
      if (result.ok) setViewportGyms(result.data)
    })
  }

  // Fires when the user finishes dragging/zooming the map — loads gyms
  // around the new spot so pins fill in as they explore, not just around
  // their own location. Skipped while a name search is active since that
  // already drives its own pin set.
  function handleMapMoveEnd(newCenter: { lat: number; lng: number }) {
    if (showingSearch) return
    loadViewportGyms(newCenter)
  }

  function openSearch() {
    setSelectedGym(null)
    setSearchOpen(true)
  }

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
  }

  function selectSearchResult(gym: GymSearchResult) {
    setSelectedGym({ ...gym, distanceM: null })
    setMapCenter({ lat: gym.lat, lng: gym.lng })
    closeSearch()
    // The recenter above is programmatic, so it won't trigger the
    // moveend-driven pin fetch — load pins around the result ourselves so
    // its marker (and its neighbors) actually show up under the card.
    loadViewportGyms({ lat: gym.lat, lng: gym.lng })
  }

  function recenterOnMe() {
    setMapCenter(userLocation)
  }

  const equipmentEntries = selectedGym ? Object.entries(selectedGym.equipment).filter(([, v]) => v) : []

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

      {/* Full-bleed map on mobile — see SkillsTree for the same edge-bleed pattern.
          The map is the whole app here: gyms load in as you drag around, tapping
          a pin opens a small preview card, and search is a toggled overlay —
          nothing pushes a persistent list into view. */}
      <div className="-mx-4 md:mx-0">
        <div className="relative h-[70vh] md:h-[72vh] md:rounded-2xl overflow-hidden bg-gray-900">
          <GymMap
            center={mapCenter}
            markers={markers}
            selectedId={selectedGym?.id ?? null}
            onMarkerClick={id => {
              const gym = mapGyms.find(g => g.id === id)
              if (gym) setSelectedGym(gym)
              setSearchOpen(false)
            }}
            youAreHere={geoState === 'granted' ? userLocation : null}
            onMoveEnd={handleMapMoveEnd}
            onMapClick={() => setSelectedGym(null)}
          />

          {geoState === 'granted' && (
            <button
              onClick={recenterOnMe}
              aria-label="Recenter on my location"
              className="absolute bottom-3 left-3 z-10 flex items-center justify-center h-11 w-11 rounded-full bg-gray-900/90 border border-gray-700 text-emerald-400 shadow-lg hover:bg-gray-800 transition-colors"
            >
              <LocateFixed className="h-5 w-5" />
            </button>
          )}

          {!searchOpen && (
            <button
              onClick={openSearch}
              aria-label="Search gyms"
              className="absolute bottom-3 right-3 z-10 flex items-center justify-center h-11 w-11 rounded-full bg-gray-900/90 border border-gray-700 text-emerald-400 shadow-lg hover:bg-gray-800 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Search overlay — pinned to the top so it never fights the
              bottom-corner buttons or a bottom preview card. */}
          {searchOpen && (
            <div className="absolute inset-x-3 top-3 z-20">
              <div className="flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900/95 backdrop-blur pl-4 pr-2 shadow-lg">
                <Search className="h-4 w-4 text-gray-500 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search gyms by name…"
                  className="flex-1 min-w-0 bg-transparent text-white text-sm py-2.5 focus:outline-none"
                />
                <button
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="p-2.5 -m-2.5 text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {showingSearch && (
                <ul className="mt-2 max-h-[45vh] overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900/95 backdrop-blur shadow-xl divide-y divide-gray-800">
                  {searchResults.map(gym => (
                    <li key={gym.id}>
                      <button
                        onClick={() => selectSearchResult(gym)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-800/60 transition-colors"
                      >
                        <MapPin className="h-4 w-4 shrink-0" style={{ color: statusColor(gym.status) }} />
                        <span className="min-w-0">
                          <span className="block text-sm text-white truncate">
                            {gymDisplayName(gym.name, gym.lat, gym.lng)}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {gym.status === 'unverified' ? 'Rumored Spot' : 'Verified'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {searchResults.length === 0 && !isPending && (
                    <li className="px-4 py-6 text-center text-sm text-gray-500">No gyms match that name.</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Gym preview card — floats above the corner buttons so both
              stay reachable while it's open. */}
          {selectedGym && !searchOpen && (
            <div className="absolute inset-x-3 bottom-20 z-10 rounded-2xl border border-gray-800 bg-gray-900/95 backdrop-blur shadow-xl p-4">
              <button
                onClick={() => setSelectedGym(null)}
                aria-label="Close"
                className="absolute top-2 right-2 p-2.5 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-6 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: statusColor(selectedGym.status) }} />
                  <span className="text-sm font-semibold text-white truncate">
                    {gymDisplayName(selectedGym.name, selectedGym.lat, selectedGym.lng)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{selectedGym.status === 'unverified' ? 'Rumored Spot' : 'Verified'}</span>
                  {selectedGym.distanceM !== null && (
                    <>
                      <span>·</span>
                      <span>{formatDistance(selectedGym.distanceM)}</span>
                    </>
                  )}
                </div>

                {equipmentEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {equipmentEntries.slice(0, 4).map(([key]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300"
                      >
                        {humanizeEquipmentKey(key)}
                      </span>
                    ))}
                    {equipmentEntries.length > 4 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{equipmentEntries.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <Link
                  href={`/gyms/${selectedGym.id}${
                    selectedGym.distanceM !== null ? `?distance_m=${Math.round(selectedGym.distanceM)}` : ''
                  }`}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors"
                >
                  View gym
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {geoState === 'denied' && !showingSearch && (
        <p className="mt-3 text-xs text-yellow-400/90">
          Location access denied — showing gyms near London. Search by name or browse the map.
        </p>
      )}
      {geoState === 'unavailable' && !showingSearch && (
        <p className="mt-3 text-xs text-yellow-400/90">
          Location isn&apos;t available on this device — showing gyms near London.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex justify-center">
        <OsmAttribution />
      </div>
    </div>
  )
}
