'use client'

import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

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
  // Picker mode: a single draggable marker the caller controls, plus a
  // click-to-place handler (used by the add-gym flow).
  pickerPosition?: { lat: number; lng: number }
  onPick?: (lat: number, lng: number) => void
}

export function GymMapInner({
  center,
  zoom = 13,
  markers = [],
  selectedId = null,
  onMarkerClick,
  pickerPosition,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const pickerMarkerRef = useRef<Marker | null>(null)
  const onPickRef = useRef(onPick)
  useEffect(() => {
    onPickRef.current = onPick
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
    })

    return () => {
      map.remove()
      mapRef.current = null
      markersById.clear()
      pickerMarkerRef.current = null
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

  return <div ref={containerRef} className="h-full w-full" />
}
