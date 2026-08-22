'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronUp, LocateFixed, MapPin, Plus, Search } from 'lucide-react'
import { getNearbyGymsAction, searchGymsAction } from '@/app/(app)/gyms/actions'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { GymMap } from './GymMap'
import { OsmAttribution } from './OsmAttribution'
import type { GymSearchResult, GymStatus, NearbyGym } from '@/types/database'

// Central London — a reasonable default center when geolocation is denied
// or unavailable (the OSM import's first region is the UK).
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }

// Vertical space the fixed mobile bottom nav occupies, including its own
// safe-area padding — see CLAUDE.md ("overlays the bottom ~4rem"). Anything
// fixed-positioned on the full-bleed mobile map screen clears the nav by
// this much instead of relying on layout padding (there isn't any on mobile
// for this route — see AppShell's fullBleed handling). Neutralized on
// desktop wherever it's paired with `md:inset-auto`.
const MOBILE_NAV_CLEARANCE = 'bottom-[calc(4rem+env(safe-area-inset-bottom))]'

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

export function GymsExplorer({ unreadCount }: { unreadCount: number }) {
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GymSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map())
  // Mobile only — the gym list renders as a sheet overlaid on the
  // full-screen map, toggled by tapping the map. Desktop always shows the
  // list alongside the map regardless of this (see the list panel's
  // md: classes), so this state has no visual effect there.
  const [showList, setShowList] = useState(true)

  useEffect(() => {
    if (!hasGeolocation()) {
      // Must run post-hydration (see the geoState comment above) rather than
      // being derived at init, so this one synchronous setState is required.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeoState('unavailable')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(coords)
        setMapCenter(coords)
        setGeoState('granted')
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
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
    : nearby.map(g => ({ ...g, distanceM: g.distance_m as number | null }))

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

  function selectGym(gym: { id: string; lat: number; lng: number }) {
    setSelectedId(gym.id)
    setMapCenter({ lat: gym.lat, lng: gym.lng })
    setShowList(true)
  }

  function recenterOnMe() {
    setMapCenter(userLocation)
  }

  return (
    <div>
      {/* Mobile-only chrome: the app header is hidden on this route (see
          AppShell) so its controls float here instead, over the map. */}
      <div className="md:hidden fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pointer-events-none">
        <span className="pointer-events-auto px-3 py-2 rounded-full bg-gray-950/90 backdrop-blur border border-gray-800 text-sm font-bold text-white shadow-lg">
          Cali<span className="text-emerald-400">Quest</span>
        </span>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="p-0.5 rounded-full bg-gray-950/90 backdrop-blur border border-gray-800 shadow-lg">
            <NotificationBell initialUnreadCount={unreadCount} />
          </div>
          <div className="p-0.5 pr-1 rounded-full bg-gray-950/90 backdrop-blur border border-gray-800 shadow-lg">
            <LogoutButton iconOnly />
          </div>
          <Link
            href="/gyms/add"
            aria-label="Add gym"
            className="flex items-center justify-center h-11 w-11 rounded-full bg-emerald-500 text-gray-950 shadow-lg"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Desktop-only title row. */}
      <div className="hidden md:flex mb-4 items-center justify-between gap-3">
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

      {/* Map — a single instance shared by both layouts (mounting two real
          MapLibre maps would double tile fetches and WebGL contexts, bad
          for mid-range phones on gym wifi). Mobile: fixed, full-screen up to
          the bottom nav, tapping the background toggles the list sheet
          below. Desktop: normal in-flow card. */}
      <div
        className={`fixed inset-x-0 top-0 z-10 overflow-hidden bg-gray-900 ${MOBILE_NAV_CLEARANCE} md:relative md:inset-auto md:z-auto md:h-[55vh] md:rounded-2xl`}
      >
        <GymMap
          center={mapCenter}
          markers={markers}
          selectedId={selectedId}
          onMarkerClick={id => {
            setSelectedId(id)
            setShowList(true)
          }}
          onBackgroundClick={() => setShowList(s => !s)}
          youAreHere={geoState === 'granted' ? userLocation : null}
        />

        {geoState === 'granted' && (
          <>
            {/* Mobile recenter button — moves up out of the way when the
                list sheet is open. */}
            <button
              onClick={recenterOnMe}
              aria-label="Recenter on my location"
              className={`md:hidden absolute left-3 z-10 flex items-center justify-center h-11 w-11 rounded-full bg-gray-900/90 border border-gray-700 text-emerald-400 shadow-lg transition-[bottom] duration-200 ${
                // This button's `bottom` is relative to the map wrapper's own
                // bottom edge, which already sits one MOBILE_NAV_CLEARANCE
                // above the true viewport bottom — so that offset isn't
                // repeated here, only the extra clearance above the sheet
                // (when open) or the nav (when closed).
                showList ? 'bottom-[calc(50vh+0.75rem)]' : 'bottom-3'
              }`}
            >
              <LocateFixed className="h-5 w-5" />
            </button>
            {/* Desktop recenter button — the map card isn't full-screen, so
                it stays put in the bottom-left corner. */}
            <button
              onClick={recenterOnMe}
              aria-label="Recenter on my location"
              className="hidden md:flex absolute bottom-3 left-3 items-center justify-center h-11 w-11 rounded-full bg-gray-900/90 border border-gray-700 text-emerald-400 shadow-lg hover:bg-gray-800 transition-colors"
            >
              <LocateFixed className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Gym list — mobile: a bottom sheet overlaid on the map, toggled by
          tapping the map (or the peek pill below); desktop: a normal card
          below the map, always visible. Kept mounted (just translated
          off-screen) on mobile even when hidden, so the scroll-into-view
          effect above can still find a selected row's ref. */}
      <div
        className={`fixed inset-x-3 z-20 mb-3 flex max-h-[50vh] flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl transition-transform duration-200 ${MOBILE_NAV_CLEARANCE} ${
          showList ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        } md:static md:inset-auto md:mx-0 md:mb-0 md:mt-4 md:max-h-none md:translate-y-0 md:shadow-xl`}
      >
        <button
          onClick={() => setShowList(false)}
          aria-label="Hide gym list"
          className="md:hidden flex shrink-0 justify-center pt-2 pb-1"
        >
          <span className="h-1 w-10 rounded-full bg-gray-700" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-1 md:pt-4">
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

          <ul className="flex-1 space-y-1 overflow-y-auto -mx-1 px-1 md:flex-none md:max-h-[40vh]">
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

          <div className="mt-3 pt-3 border-t border-gray-800 shrink-0">
            <OsmAttribution />
          </div>
        </div>
      </div>

      {/* Peek pill to reopen the sheet on mobile — the tap-anywhere-on-the
          -map gesture also does this, but this stays visible as a
          discoverable affordance. */}
      {!showList && (
        <button
          onClick={() => setShowList(true)}
          className={`md:hidden fixed inset-x-3 z-10 mb-3 flex items-center justify-center gap-1.5 rounded-2xl border border-gray-800 bg-gray-900/95 backdrop-blur px-4 py-3 text-sm font-semibold text-white shadow-xl ${MOBILE_NAV_CLEARANCE}`}
        >
          <ChevronUp className="h-4 w-4" />
          {listItems.length === 0 ? 'Show gyms' : `Show ${listItems.length} nearby gyms`}
        </button>
      )}
    </div>
  )
}
