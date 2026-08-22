'use server'

import { revalidatePath } from 'next/cache'
import type { Logger } from 'pino'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import {
  cancelCompetitionAsCreatorOrAdmin,
  cancelParticipation,
  createCompetition,
  getMyCompetitions,
  getNearbyCompetitionsForUser,
  getUpcomingCompetitionsForGym,
  searchCompetitions,
  setParticipation,
  type CreateCompetitionInput,
} from '@/lib/services/competitions.service'
import type {
  Competition,
  CompetitionIntent,
  CompetitionParticipantStatus,
  CompetitionSearchResult,
  NearbyCompetition,
  UpcomingCompetitionAtGym,
} from '@/types/database'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

// Known sentinel error codes from the service layer are expected control
// flow (validation, a closed registration window, a permission check) —
// logged at warn. Anything else (a thrown Supabase/Postgres error, a bug)
// is unexpected — logged at error with the full err object. Mirrors
// squads/actions.ts's logActionOutcome helper.
const errorMessages: Record<string, string> = {
  NAME_REQUIRED:                  'Give the competition a name.',
  GYM_NOT_FOUND:                  'That gym is no longer available.',
  START_DATE_REQUIRED:            'Pick a start date and time.',
  START_DATE_IN_PAST:             'Start date must be in the future.',
  INVALID_END_DATE:               'End date must be after the start date.',
  INVALID_REGISTRATION_DEADLINE:  'Registration deadline must be before the event starts.',
  INVALID_SKILL_LEVEL:            'Pick a valid skill level.',
  INVALID_CAPACITY:               'Capacity must be a positive number.',
  INVALID_ENTRY_FEE:              'Entry fee must be zero or more.',
  INVALID_CURRENCY:               'Enter a valid 3-letter currency code.',
  COMPETITION_NOT_FOUND:          'This competition is no longer available.',
  NOT_CREATOR:                    'Only the organizer can do that.',
  COMPETITION_CANCELLED:          'This competition has been cancelled.',
  EVENT_ENDED:                    'This competition has already finished.',
  REGISTRATION_CLOSED:            'Registration has closed for this competition.',
}

function friendlyError(e: unknown): string {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  return errorMessages[code] ?? 'Something went wrong. Please try again.'
}

function logActionOutcome(log: Logger, action: string, e: unknown, context: Record<string, unknown>) {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  if (code in errorMessages) {
    log.warn({ ...context, code }, `${action} rejected`)
  } else {
    log.error({ ...context, err: e }, `${action} failed unexpectedly`)
  }
}

async function requireUser() {
  const { data: { user } } = await getAuthenticatedUser()
  return user
}

export async function getNearbyCompetitionsAction(lat: number, lng: number): Promise<ActionResult<NearbyCompetition[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const competitions = await getNearbyCompetitionsForUser(lat, lng)
    return { ok: true, data: competitions }
  } catch {
    return { ok: false, error: 'Could not load nearby competitions.' }
  }
}

export async function searchCompetitionsAction(query: string): Promise<ActionResult<CompetitionSearchResult[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const results = await searchCompetitions(query)
    return { ok: true, data: results }
  } catch {
    return { ok: false, error: 'Search failed.' }
  }
}

export async function getUpcomingCompetitionsForGymAction(gymId: string): Promise<ActionResult<UpcomingCompetitionAtGym[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const competitions = await getUpcomingCompetitionsForGym(gymId)
    return { ok: true, data: competitions }
  } catch {
    return { ok: false, error: 'Could not load competitions for this gym.' }
  }
}

export async function getMyCompetitionsAction(): Promise<ActionResult<(Competition & { intent: CompetitionIntent })[]>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const competitions = await getMyCompetitions(user.id)
    return { ok: true, data: competitions }
  } catch {
    return { ok: false, error: 'Could not load your competitions.' }
  }
}

export async function createCompetitionAction(input: CreateCompetitionInput): Promise<ActionResult<{ competitionId: string }>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'competitions', action: 'createCompetition' })

  try {
    const competition = await createCompetition(user.id, input)
    revalidatePath('/competitions')
    revalidatePath(`/gyms/${input.gym_id}`)
    log.info({ competitionId: competition.id, gymId: input.gym_id }, 'Competition created')
    return { ok: true, data: { competitionId: competition.id } }
  } catch (e) {
    logActionOutcome(log, 'createCompetition', e, { gymId: input.gym_id })
    return { ok: false, error: friendlyError(e) }
  }
}

export async function cancelCompetitionAction(competitionId: string): Promise<ActionResult<null>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'competitions', action: 'cancelCompetition', competitionId })

  try {
    await cancelCompetitionAsCreatorOrAdmin(user.id, competitionId)
    revalidatePath(`/competitions/${competitionId}`)
    revalidatePath('/competitions')
    log.info('Competition cancelled')
    return { ok: true, data: null }
  } catch (e) {
    logActionOutcome(log, 'cancelCompetition', e, {})
    return { ok: false, error: friendlyError(e) }
  }
}

export async function setParticipationAction(
  competitionId: string,
  intent: CompetitionIntent
): Promise<ActionResult<CompetitionParticipantStatus>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'competitions', action: 'setParticipation', competitionId })

  try {
    const status = await setParticipation(user.id, competitionId, intent)
    revalidatePath(`/competitions/${competitionId}`)
    revalidatePath('/competitions')
    log.info({ intent, waitlisted: status.waitlisted }, 'Competition participation set')
    return { ok: true, data: status }
  } catch (e) {
    logActionOutcome(log, 'setParticipation', e, { intent })
    return { ok: false, error: friendlyError(e) }
  }
}

export async function cancelParticipationAction(competitionId: string): Promise<ActionResult<null>> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'competitions', action: 'cancelParticipation', competitionId })

  try {
    await cancelParticipation(user.id, competitionId)
    revalidatePath(`/competitions/${competitionId}`)
    revalidatePath('/competitions')
    log.info('Competition participation cancelled')
    return { ok: true, data: null }
  } catch (e) {
    logActionOutcome(log, 'cancelParticipation', e, {})
    return { ok: false, error: friendlyError(e) }
  }
}
