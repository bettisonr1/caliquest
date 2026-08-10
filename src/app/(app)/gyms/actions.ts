'use server'

import { revalidatePath } from 'next/cache'
import type { Logger } from 'pino'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import {
  addGym,
  adminUpdateGym,
  findNearbyDuplicateGyms,
  getNearbyGymsForUser,
  proposeSuggestion,
  removeGymReview,
  searchGyms,
  submitGymReview,
  voteOnSuggestion,
} from '@/lib/services/gyms.service'
import type { Gym, GymEquipment, GymSearchResult, GymSuggestionField, GymSuggestionVoteValue, NearbyGym } from '@/types/database'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Known sentinel error codes from the suggestions service/RPCs are expected
// control flow (validation, the one-pending-suggestion-per-field rule, a
// vote arriving after resolution) — logged at warn. Anything else (a thrown
// Supabase/Postgres error, a bug) is unexpected — logged at error with the
// full err object. Mirrors squads/actions.ts's logActionOutcome helper.
const suggestionErrorMessages: Record<string, string> = {
  GYM_NOT_FOUND:               'This gym is no longer available.',
  NAME_REQUIRED:                'Enter a name before submitting.',
  EQUIPMENT_REQUIRED:           'Pick at least one piece of equipment.',
  INVALID_FIELD:                 'That field can’t be suggested.',
  SUGGESTION_ALREADY_PENDING:   'There’s already a pending suggestion for this — vote on it instead.',
  INVALID_VOTE:                  'That’s not a valid vote.',
  SUGGESTION_NOT_PENDING:       'This suggestion has already been resolved.',
  NOT_ADMIN:                     'You don’t have permission to do that.',
}

function friendlySuggestionError(e: unknown): string {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  return suggestionErrorMessages[code] ?? 'Something went wrong. Please try again.'
}

function logSuggestionOutcome(log: Logger, action: string, e: unknown, context: Record<string, unknown>) {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  if (code in suggestionErrorMessages) {
    log.warn({ ...context, code }, `${action} rejected`)
  } else {
    log.error({ ...context, err: e }, `${action} failed unexpectedly`)
  }
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

export async function proposeSuggestionAction(
  gymId: string,
  field: GymSuggestionField,
  value: string | GymEquipment
): Promise<ActionResult<{ suggestionId: string }>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'gym-suggestions', action: 'proposeSuggestion', gymId })

  try {
    const suggestionId = await proposeSuggestion(user.id, gymId, field, value)
    revalidatePath(`/gyms/${gymId}`)
    log.info({ suggestionId, field }, 'Gym suggestion proposed')
    return { ok: true, data: { suggestionId } }
  } catch (e) {
    logSuggestionOutcome(log, 'proposeSuggestion', e, { field })
    return { ok: false, error: friendlySuggestionError(e) }
  }
}

// Direct edit for admins — bypasses proposeSuggestion/voteOnSuggestion
// entirely (see adminUpdateGym in gyms.service.ts).
export async function adminUpdateGymAction(
  gymId: string,
  fields: { name?: string | null; equipment?: GymEquipment }
): Promise<ActionResult<Gym>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'gym-admin-edit', action: 'adminUpdateGym', gymId })

  try {
    const gym = await adminUpdateGym(user.id, gymId, fields)
    revalidatePath(`/gyms/${gymId}`)
    log.info({ fields: Object.keys(fields) }, 'Gym updated by admin')
    return { ok: true, data: gym }
  } catch (e) {
    logSuggestionOutcome(log, 'adminUpdateGym', e, { fields: Object.keys(fields) })
    return { ok: false, error: friendlySuggestionError(e) }
  }
}

export async function voteOnSuggestionAction(
  gymId: string,
  suggestionId: string,
  vote: GymSuggestionVoteValue
): Promise<ActionResult<null>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'gym-suggestions', action: 'voteOnSuggestion', gymId, suggestionId })

  try {
    await voteOnSuggestion(user.id, suggestionId, vote)
    revalidatePath(`/gyms/${gymId}`)
    log.info({ vote }, 'Gym suggestion vote cast')
    return { ok: true, data: null }
  } catch (e) {
    logSuggestionOutcome(log, 'voteOnSuggestion', e, { vote })
    return { ok: false, error: friendlySuggestionError(e) }
  }
}
