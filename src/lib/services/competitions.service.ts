import { createClient } from '@/lib/supabase/server'
import {
  cancelCompetition,
  deleteParticipant,
  getCompetitionById,
  getCompetitionParticipantStatus,
  getCompetitionsByIds,
  getCompetitionsForGym,
  getNearbyCompetitions,
  getParticipantRowsForUser,
  insertCompetition,
  searchCompetitionsByName,
  upsertParticipant,
} from '@/lib/repositories/competitions.repository'
import { getGymById, getPublicProfiles } from '@/lib/repositories/gyms.repository'
import type {
  Competition,
  CompetitionIntent,
  CompetitionParticipantStatus,
  CompetitionParticipantStatusWithProfile,
  CompetitionSearchResult,
  CompetitionSkillLevel,
  Gym,
  NearbyCompetition,
  UpcomingCompetitionAtGym,
} from '@/types/database'

const MAX_NAME_CHARS = 100
const MAX_DESCRIPTION_CHARS = 2000
const VALID_SKILL_LEVELS: CompetitionSkillLevel[] = ['open', 'beginner', 'intermediate', 'advanced']

export async function getNearbyCompetitionsForUser(lat: number, lng: number): Promise<NearbyCompetition[]> {
  const supabase = await createClient()
  return getNearbyCompetitions(supabase, lat, lng)
}

export async function searchCompetitions(query: string): Promise<CompetitionSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const supabase = await createClient()
  return searchCompetitionsByName(supabase, trimmed)
}

export async function getUpcomingCompetitionsForGym(gymId: string): Promise<UpcomingCompetitionAtGym[]> {
  const supabase = await createClient()
  return getCompetitionsForGym(supabase, gymId)
}

// Competitions a user has registered for or is attending, soonest first —
// the competitions home page's "Mine" tab. Intent comes straight from the
// participant row; a full waitlist position isn't fetched here (that
// would mean one RPC call per competition) — the detail page is where a
// waitlisted competitor sees their exact status.
export async function getMyCompetitions(userId: string): Promise<(Competition & { intent: CompetitionIntent })[]> {
  const supabase = await createClient()
  const rows = await getParticipantRowsForUser(supabase, userId)
  if (rows.length === 0) return []

  const intentByCompetitionId = new Map(rows.map(r => [r.competition_id, r.intent]))
  const competitions = await getCompetitionsByIds(supabase, [...intentByCompetitionId.keys()])

  return competitions
    .map(c => ({ ...c, intent: intentByCompetitionId.get(c.id)! }))
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
}

export type CompetitionDetail = {
  competition: Competition
  gym: Gym | null
  participants: CompetitionParticipantStatusWithProfile[]
  competingCount: number
  waitlistCount: number
  attendingCount: number
  viewerStatus: CompetitionParticipantStatus | null
  // Computed here (server-side "now"), not in the page component — a React
  // Server Component's render must stay pure, and Date.now() isn't.
  canRegisterToCompete: boolean
  canAttend: boolean
  registrationClosed: boolean
}

export async function getCompetitionDetail(competitionId: string, viewerId: string): Promise<CompetitionDetail | null> {
  const supabase = await createClient()

  const competition = await getCompetitionById(supabase, competitionId)
  if (!competition) return null

  const [gym, statusRows] = await Promise.all([
    getGymById(supabase, competition.gym_id),
    getCompetitionParticipantStatus(supabase, competitionId),
  ])

  const profileIds = [...new Set(statusRows.map(r => r.user_id))]
  const profiles = await getPublicProfiles(supabase, profileIds)
  const profileById = new Map(profiles.map(p => [p.user_id, p]))

  const participants: CompetitionParticipantStatusWithProfile[] = statusRows.map(r => ({
    ...r,
    profile: profileById.get(r.user_id) ?? null,
  }))

  const eventEndsAt = competition.end_at ?? competition.start_at
  const eventHasEnded = new Date(eventEndsAt).getTime() < Date.now()
  const registrationClosed = Boolean(
    competition.registration_deadline && new Date(competition.registration_deadline).getTime() < Date.now()
  )

  return {
    competition,
    gym,
    participants,
    competingCount: statusRows.filter(r => r.intent === 'competing' && !r.waitlisted).length,
    waitlistCount: statusRows.filter(r => r.intent === 'competing' && r.waitlisted).length,
    attendingCount: statusRows.filter(r => r.intent === 'attending').length,
    viewerStatus: statusRows.find(r => r.user_id === viewerId) ?? null,
    canRegisterToCompete: competition.status !== 'cancelled' && !eventHasEnded && !registrationClosed,
    canAttend: competition.status !== 'cancelled' && !eventHasEnded,
    registrationClosed,
  }
}

export type CreateCompetitionInput = {
  gym_id: string
  name: string
  description: string | null
  image_url: string | null
  start_at: string
  end_at: string | null
  registration_deadline: string | null
  skill_level: CompetitionSkillLevel
  entry_fee_minor_units: number | null
  currency: string
  capacity: number | null
  external_registration_url: string | null
}

export async function createCompetition(userId: string, input: CreateCompetitionInput): Promise<Competition> {
  const supabase = await createClient()

  const name = input.name.trim().slice(0, MAX_NAME_CHARS)
  if (name === '') throw new Error('NAME_REQUIRED')

  const gym = await getGymById(supabase, input.gym_id)
  if (!gym) throw new Error('GYM_NOT_FOUND')

  const startAt = new Date(input.start_at)
  if (Number.isNaN(startAt.getTime())) throw new Error('START_DATE_REQUIRED')
  if (startAt.getTime() < Date.now()) throw new Error('START_DATE_IN_PAST')

  let endAt: Date | null = null
  if (input.end_at) {
    endAt = new Date(input.end_at)
    if (Number.isNaN(endAt.getTime()) || endAt.getTime() < startAt.getTime()) throw new Error('INVALID_END_DATE')
  }

  let registrationDeadline: Date | null = null
  if (input.registration_deadline) {
    registrationDeadline = new Date(input.registration_deadline)
    if (Number.isNaN(registrationDeadline.getTime()) || registrationDeadline.getTime() > startAt.getTime()) {
      throw new Error('INVALID_REGISTRATION_DEADLINE')
    }
  }

  if (!VALID_SKILL_LEVELS.includes(input.skill_level)) throw new Error('INVALID_SKILL_LEVEL')

  if (input.capacity !== null && (!Number.isInteger(input.capacity) || input.capacity < 1)) {
    throw new Error('INVALID_CAPACITY')
  }

  if (input.entry_fee_minor_units !== null && (!Number.isInteger(input.entry_fee_minor_units) || input.entry_fee_minor_units < 0)) {
    throw new Error('INVALID_ENTRY_FEE')
  }

  const currency = input.currency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('INVALID_CURRENCY')

  return insertCompetition(supabase, {
    gym_id: input.gym_id,
    name,
    description: input.description?.trim().slice(0, MAX_DESCRIPTION_CHARS) || null,
    image_url: input.image_url,
    start_at: startAt.toISOString(),
    end_at: endAt?.toISOString() ?? null,
    registration_deadline: registrationDeadline?.toISOString() ?? null,
    skill_level: input.skill_level,
    entry_fee_minor_units: input.entry_fee_minor_units,
    currency,
    capacity: input.capacity,
    external_registration_url: input.external_registration_url?.trim() || null,
    created_by: userId,
  })
}

// Creator or admin only — the "Creator or admin can update competition"
// RLS policy is the real enforcement; this check gives a clear error
// instead of a silent no-op update.
export async function cancelCompetitionAsCreatorOrAdmin(userId: string, competitionId: string): Promise<Competition> {
  const supabase = await createClient()

  const competition = await getCompetitionById(supabase, competitionId)
  if (!competition) throw new Error('COMPETITION_NOT_FOUND')
  if (competition.created_by !== userId) throw new Error('NOT_CREATOR')

  return cancelCompetition(supabase, competitionId)
}

// Register to compete or mark yourself as attending. Never rejects for
// being past capacity — a 'competing' signup past capacity just reads
// back as waitlisted (see competition_participant_status in schema.sql).
export async function setParticipation(
  userId: string,
  competitionId: string,
  intent: CompetitionIntent
): Promise<CompetitionParticipantStatus> {
  const supabase = await createClient()

  const competition = await getCompetitionById(supabase, competitionId)
  if (!competition) throw new Error('COMPETITION_NOT_FOUND')
  if (competition.status === 'cancelled') throw new Error('COMPETITION_CANCELLED')

  const eventEndsAt = competition.end_at ?? competition.start_at
  if (new Date(eventEndsAt).getTime() < Date.now()) throw new Error('EVENT_ENDED')

  if (intent === 'competing' && competition.registration_deadline) {
    if (new Date(competition.registration_deadline).getTime() < Date.now()) {
      throw new Error('REGISTRATION_CLOSED')
    }
  }

  await upsertParticipant(supabase, { competition_id: competitionId, user_id: userId, intent })

  const statusRows = await getCompetitionParticipantStatus(supabase, competitionId)
  const viewerStatus = statusRows.find(r => r.user_id === userId)
  if (!viewerStatus) throw new Error('PARTICIPATION_NOT_FOUND')
  return viewerStatus
}

export async function cancelParticipation(userId: string, competitionId: string): Promise<void> {
  const supabase = await createClient()
  await deleteParticipant(supabase, competitionId, userId)
}
