'use client'

import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// MapLibre resolves its worker script relative to its own bundled chunk's
// import.meta.url at runtime, which Turbopack doesn't serve at that path —
// the map still initializes (background layer, controls, our own marker DOM
// nodes all render fine) but the worker never loads, so it silently never
// requests a single vector tile. `scripts/copy-maplibre-worker.mjs` vendors
// the worker's real files (it has one sibling import of its own) into
// public/maplibre/ on every `npm install`, and this points there directly.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

// Free vector tiles, no API key required.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export type MapMarker = {
  id: string
  lat: number
  lng: number
  color: string
}

type Props = {
  center: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  selectedId?: string | null
  onMarkerClick?: (id: string) => void
  // The user's real geolocation fix, rendered as a distinct non-interactive
  // dot so it reads clearly apart from gym pins — separate from `center`,
  // which only controls where the map is currently panned to.
  youAreHere?: { lat: number; lng: number } | null
  // Picker mode: a single draggable marker the caller controls, plus a
  // click-to-place handler (used by the add-gym flow).
  pickerPosition?: { lat: number; lng: number }
  onPick?: (lat: number, lng: number) => void
  // Fires on a click that lands on the map background (not a marker —
  // marker click handlers stopPropagation before it can bubble up here).
  // Used by GymsExplorer's mobile layout to dismiss a gym's preview card.
  onBackgroundClick?: () => void
  // Fired when the user finishes dragging/zooming the map (not when we
  // move it ourselves via the recenter effect below) — lets the caller
  // load gyms around wherever they've panned to.
  onMoveEnd?: (center: { lat: number; lng: number }) => void
}

export function GymMapInner({
  center,
  zoom = 13,
  markers = [],
  selectedId = null,
  onMarkerClick,
  youAreHere = null,
  pickerPosition,
  onPick,
  onBackgroundClick,
  onMoveEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const pickerMarkerRef = useRef<Marker | null>(null)
  const youAreHereMarkerRef = useRef<Marker | null>(null)
  const onPickRef = useRef(onPick)
  const onBackgroundClickRef = useRef(onBackgroundClick)
  const onMoveEndRef = useRef(onMoveEnd)
  useEffect(() => {
    onPickRef.current = onPick
    onBackgroundClickRef.current = onBackgroundClick
    onMoveEndRef.current = onMoveEnd
  })

  // Map instance lifecycle — created once per mount.
  useEffect(() => {
    if (!containerRef.current) return
    const markersById = markersRef.current

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: { compact: false },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map

    map.on('click', e => {
      onPickRef.current?.(e.lngLat.lat, e.lngLat.lng)
      onBackgroundClickRef.current?.()
    })

    // originalEvent is only set for user-driven moves (drag, scroll/pinch
    // zoom, double-click) — programmatic ones (the recenter effect's
    // easeTo, picking a gym) leave it undefined, so this only fires for
    // actual map exploration, not every time `center` prop changes.
    map.on('moveend', e => {
      if (!e.originalEvent) return
      const c = map.getCenter()
      onMoveEndRef.current?.({ lat: c.lat, lng: c.lng })
    })

    return () => {
      map.remove()
      mapRef.current = null
      markersById.clear()
      pickerMarkerRef.current = null
      youAreHereMarkerRef.current = null
    }
    // Runs once per mount — center/zoom are only used for initial placement,
    // later changes are handled by the recenter effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-center when the caller's center changes (e.g. geolocation resolves).
  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 500 })
  }, [center.lat, center.lng])

  // Sync gym markers.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const seen = new Set<string>()
    for (const m of markers) {
      seen.add(m.id)
      const existing = markersRef.current.get(m.id)
      if (existing) {
        existing.setLngLat([m.lng, m.lat])
      } else {
        const el = document.createElement('button')
        el.setAttribute('aria-label', 'Gym location')
        el.style.width = '18px'
        el.style.height = '18px'
        el.style.borderRadius = '50%'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.5)'
        el.style.cursor = 'pointer'
        el.style.background = m.color
        el.addEventListener('click', ev => {
          ev.stopPropagation()
          onMarkerClick?.(m.id)
        })
        const marker = new Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map)
        markersRef.current.set(m.id, marker)
      }
    }
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }
  }, [markers, onMarkerClick])

  // Highlight the selected marker.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement()
      el.style.outline = id === selectedId ? '3px solid #34d399' : 'none'
      el.style.zIndex = id === selectedId ? '10' : '0'
    }
  }, [selectedId, markers])

  // Picker-mode marker.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!pickerPosition) {
      pickerMarkerRef.current?.remove()
      pickerMarkerRef.current = null
      return
    }
    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLngLat([pickerPosition.lng, pickerPosition.lat])
    } else {
      pickerMarkerRef.current = new Marker({ color: '#34d399', draggable: true })
        .setLngLat([pickerPosition.lng, pickerPosition.lat])
        .addTo(map)
      pickerMarkerRef.current.on('dragend', () => {
        const { lat, lng } = pickerMarkerRef.current!.getLngLat()
        onPickRef.current?.(lat, lng)
      })
    }
  }, [pickerPosition])

  // "You are here" marker — a plain dot, not a gym pin: no click handler,
  // not draggable, purely a location indicator.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!youAreHere) {
      youAreHereMarkerRef.current?.remove()
      youAreHereMarkerRef.current = null
      return
    }
    if (youAreHereMarkerRef.current) {
      youAreHereMarkerRef.current.setLngLat([youAreHere.lng, youAreHere.lat])
    } else {
      const el = document.createElement('div')
      el.setAttribute('aria-label', 'Your location')
      el.style.width = '16px'
      el.style.height = '16px'
      el.style.borderRadius = '50%'
      el.style.border = '3px solid white'
      el.style.background = '#3b82f6'
      el.style.boxShadow = '0 0 0 6px rgba(59,130,246,0.25), 0 1px 4px rgba(0,0,0,0.5)'
      youAreHereMarkerRef.current = new Marker({ element: el }).setLngLat([youAreHere.lng, youAreHere.lat]).addTo(map)
    }
  }, [youAreHere?.lat, youAreHere?.lng])

  return <div ref={containerRef} className="h-full w-full" />
}
