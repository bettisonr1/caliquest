'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  addGym,
  findNearbyDuplicateGyms,
  getNearbyGymsForUser,
  removeGymReview,
  searchGyms,
  submitGymReview,
} from '@/lib/services/gyms.service'
import type { GymEquipment, GymSearchResult, NearbyGym } from '@/types/database'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getNearbyGymsAction(lat: number, lng: number): Promise<ActionResult<NearbyGym[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const gyms = await getNearbyGymsForUser(lat, lng)
    return { ok: true, data: gyms }
  } catch {
    return { ok: false, error: 'Could not load nearby gyms.' }
  }
}

// Nearest single gym within tagging range, for the workout "where are you
// training?" suggestion chip. Never blocks workout logging if it fails.
export async function getNearestGymAction(lat: number, lng: number): Promise<ActionResult<NearbyGym | null>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const gyms = (await getNearbyGymsForUser(lat, lng)).filter(g => g.distance_m <= 150)
    return { ok: true, data: gyms[0] ?? null }
  } catch {
    return { ok: false, error: 'Could not find nearby gyms.' }
  }
}

export async function searchGymsAction(query: string): Promise<ActionResult<GymSearchResult[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const gyms = await searchGyms(query)
    return { ok: true, data: gyms }
  } catch {
    return { ok: false, error: 'Search failed.' }
  }
}

export async function checkNearbyDuplicatesAction(lat: number, lng: number): Promise<ActionResult<NearbyGym[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const gyms = await findNearbyDuplicateGyms(lat, lng)
    return { ok: true, data: gyms }
  } catch {
    return { ok: false, error: 'Could not check for nearby gyms.' }
  }
}

export async function addGymAction(input: {
  name: string | null
  lat: number
  lng: number
  equipment: GymEquipment
}): Promise<ActionResult<{ gymId: string }>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const gym = await addGym(user.id, input)
    revalidatePath('/gyms')
    return { ok: true, data: { gymId: gym.id } }
  } catch {
    return { ok: false, error: 'Could not add gym. Please try again.' }
  }
}

export async function submitReviewAction(
  gymId: string,
  rating: number,
  comment: string | null
): Promise<ActionResult<null>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await submitGymReview(user.id, gymId, rating, comment)
    revalidatePath(`/gyms/${gymId}`)
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: 'Could not save your review.' }
  }
}

export async function deleteReviewAction(gymId: string): Promise<ActionResult<null>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await removeGymReview(user.id, gymId)
    revalidatePath(`/gyms/${gymId}`)
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: 'Could not remove your review.' }
  }
}
