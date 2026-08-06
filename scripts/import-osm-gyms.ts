// One-off import of outdoor calisthenics gyms from OpenStreetMap via the
// Overpass API. Not part of the app runtime — run manually:
//
//   npm run import:osm-gyms -- --bbox=49.9,-8.6,60.9,1.8
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role, not the
// anon key — the gyms insert policy requires created_by = auth.uid(), which
// no unauthenticated script has, so this needs to bypass RLS). Put them in
// .env.local or export them before running.
//
// Idempotent: upserts on osm_id, so re-running (or importing more regions
// later) is safe. Import one region at a time — the default bbox below is
// the whole UK, which is a reasonable first run but a large Overpass query;
// narrow it for faster iteration.

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const CLUSTER_RADIUS_M = 75
// Equipment nodes almost never carry their own name tag, but the park they
// sit in usually does. Name-match against the nearest named park within this
// radius of the cluster centroid — a proximity heuristic, not true polygon
// containment (that'd need way/relation geometry, not just centroids), so
// it's kept tight to avoid mis-naming a gym after an unrelated nearby park.
const PARK_MATCH_RADIUS_M = 150

// [south, west, north, east]
const DEFAULT_BBOX: [number, number, number, number] = [49.9, -8.6, 60.9, 1.8]

type OverpassElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type GymEquipment = Record<string, boolean>

type Cluster = {
  osmIds: number[]
  lat: number
  lng: number
  name: string | null
  equipment: GymEquipment
}

function parseBbox(argv: string[]): [number, number, number, number] {
  const arg = argv.find(a => a.startsWith('--bbox='))
  if (!arg) return DEFAULT_BBOX
  const parts = arg.slice('--bbox='.length).split(',').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    throw new Error('--bbox must be south,west,north,east (e.g. --bbox=51.28,-0.51,51.69,0.33)')
  }
  return parts as [number, number, number, number]
}

function buildQuery(bbox: [number, number, number, number]): string {
  const bboxStr = bbox.join(',')
  return `
    [out:json][timeout:180];
    (
      node["leisure"="fitness_station"](${bboxStr});
      way["leisure"="fitness_station"](${bboxStr});
      relation["leisure"="fitness_station"](${bboxStr});
      node["sport"="calisthenics"](${bboxStr});
      way["sport"="calisthenics"](${bboxStr});
      relation["sport"="calisthenics"](${bboxStr});
      way["leisure"="park"]["name"](${bboxStr});
      way["leisure"="garden"]["name"](${bboxStr});
      way["landuse"="recreation_ground"]["name"](${bboxStr});
      relation["leisure"="park"]["name"](${bboxStr});
      relation["landuse"="recreation_ground"]["name"](${bboxStr});
    );
    out center tags;
  `
}

function isFitnessElement(tags: Record<string, string>): boolean {
  // Deliberately narrow to OSM's two outdoor-specific tags. An earlier,
  // broader `sport=fitness` + any `leisure` match also pulled in indoor
  // commercial chains (PureGym, Anytime Fitness — tagged leisure=fitness_centre),
  // which don't belong in a free-outdoor-park-gym dataset.
  return tags.leisure === 'fitness_station' || tags.sport === 'calisthenics'
}

function isNamedParkArea(tags: Record<string, string>): boolean {
  return Boolean(tags.name) && (tags.leisure === 'park' || tags.leisure === 'garden' || tags.landuse === 'recreation_ground')
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// The shared public overpass-api.de instance regularly returns 504 ("server
// too busy") independent of query size or our own rate limit (check
// https://overpass-api.de/api/status) — Overpass's own usage policy asks
// clients to back off and retry rather than resubmit immediately.
const MAX_ATTEMPTS = 5
const RETRY_STATUS_CODES = new Set([429, 504])

async function fetchOverpassElements(bbox: [number, number, number, number]): Promise<OverpassElement[]> {
  const query = buildQuery(bbox)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // overpass-api.de returns 406 for requests with no User-Agent (Node's
        // fetch sends none by default). Their usage policy also asks for a
        // descriptive one so operators can identify heavy consumers.
        'User-Agent': 'CaliQuest-GymImport/1.0 (https://github.com/bettisonr1/caliquest)',
      },
      body: `data=${encodeURIComponent(query)}`,
    })
    if (res.ok) {
      const json = (await res.json()) as { elements: OverpassElement[] }
      return json.elements
    }

    const body = await res.text()
    const retryable = RETRY_STATUS_CODES.has(res.status)
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`Overpass request failed: ${res.status} ${body}`)
    }

    const delayMs = 30_000 * 2 ** (attempt - 1) // 30s, 60s, 120s, 240s
    console.log(`Overpass returned ${res.status} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delayMs / 1000}s…`)
    await sleep(delayMs)
  }

  throw new Error('unreachable')
}

function elementCoords(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
    return { lat: el.lat, lng: el.lon }
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon }
  }
  return null
}

function equipmentFromTags(tags: Record<string, string>): GymEquipment {
  const equipment: GymEquipment = {}
  for (const [key, value] of Object.entries(tags)) {
    if (key.startsWith('fitness_station:') && value === 'yes') {
      equipment[key.slice('fitness_station:'.length)] = true
    }
  }
  if (tags.sport === 'calisthenics') equipment.calisthenics = true
  return equipment
}

function areaFromTags(tags: Record<string, string>): string | null {
  return tags['addr:suburb'] ?? tags['addr:city'] ?? tags['addr:town'] ?? null
}

// Haversine distance in meters.
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

type NamedArea = { name: string; lat: number; lng: number }

function namedParkAreas(elements: OverpassElement[]): NamedArea[] {
  const areas: NamedArea[] = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    const coords = elementCoords(el)
    if (coords && isNamedParkArea(tags)) areas.push({ name: tags.name, lat: coords.lat, lng: coords.lng })
  }
  return areas
}

// Fill in clusters that got no name from their own tags with the nearest
// named park within PARK_MATCH_RADIUS_M, if any.
function enrichWithParkNames(clusters: Cluster[], parks: NamedArea[]): number {
  let matched = 0
  for (const cluster of clusters) {
    if (cluster.name) continue
    let nearest: { name: string; distance: number } | null = null
    for (const park of parks) {
      const distance = distanceMeters(cluster, park)
      if (distance <= PARK_MATCH_RADIUS_M && (!nearest || distance < nearest.distance)) {
        nearest = { name: park.name, distance }
      }
    }
    if (nearest) {
      cluster.name = nearest.name
      matched++
    }
  }
  return matched
}

// Merge equipment nodes a few meters apart into one gym (a single park gym
// is often mapped as several fitness_station nodes), unioning equipment tags.
function clusterElements(elements: OverpassElement[]): Cluster[] {
  const clusters: Cluster[] = []

  for (const el of elements) {
    const coords = elementCoords(el)
    if (!coords) continue
    const tags = el.tags ?? {}
    const equipment = equipmentFromTags(tags)
    const name = tags.name ?? (areaFromTags(tags) ? `Calisthenics spot, ${areaFromTags(tags)}` : null)

    const existing = clusters.find(c => distanceMeters(c, coords) <= CLUSTER_RADIUS_M)
    if (existing) {
      existing.osmIds.push(el.id)
      existing.equipment = { ...existing.equipment, ...equipment }
      if (!existing.name && name) existing.name = name
    } else {
      clusters.push({ osmIds: [el.id], lat: coords.lat, lng: coords.lng, name, equipment })
    }
  }

  return clusters
}

async function main() {
  const bbox = parseBbox(process.argv.slice(2))

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role key, not anon) before running.')
  }
  const supabase = createClient(url, serviceRoleKey)

  console.log(`Querying Overpass for bbox [${bbox.join(', ')}]…`)
  const elements = await fetchOverpassElements(bbox)
  const fitnessElements = elements.filter(el => isFitnessElement(el.tags ?? {}))
  const parks = namedParkAreas(elements)
  console.log(`Fetched ${fitnessElements.length} fitness elements and ${parks.length} named parks.`)

  const clusters = clusterElements(fitnessElements)
  console.log(`Clustered into ${clusters.length} gyms (merged within ${CLUSTER_RADIUS_M}m).`)

  const parkMatches = enrichWithParkNames(clusters, parks)
  console.log(`Named ${parkMatches} otherwise-unnamed gyms after their nearest park (within ${PARK_MATCH_RADIUS_M}m).`)

  const rows = clusters.map(c => ({
    name: c.name,
    location: `POINT(${c.lng} ${c.lat})`,
    source: 'osm' as const,
    // Merged clusters share one row; key it on the first (lowest) node id so
    // re-imports with the same OSM data land on the same row.
    osm_id: Math.min(...c.osmIds),
    equipment: c.equipment,
    status: 'verified' as const,
  }))

  const BATCH_SIZE = 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('gyms').upsert(batch, { onConflict: 'osm_id' })
    if (error) throw error
    console.log(`Upserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
