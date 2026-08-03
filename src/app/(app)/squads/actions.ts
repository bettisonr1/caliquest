'use server'

import { revalidatePath } from 'next/cache'
import type { Logger } from 'pino'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import {
  createSquad,
  inviteToSquad,
  leaveSquad,
  postToWall,
  removeMember,
  respondToInvite,
  updateSquad,
  type SquadDetailsInput,
} from '@/lib/services/squads.service'

type ActionResult = { ok: true } | { ok: false; error: string }

const errorMessages: Record<string, string> = {
  NAME_REQUIRED:               'Give your squad a name.',
  NOT_A_MEMBER:                'You are not a member of this squad.',
  NOT_LEADER:                  'Only the squad leader can do that.',
  NOT_FRIENDS:                 'You can only invite accepted friends.',
  ALREADY_IN_SQUAD:            'That person is already in the squad.',
  NOT_FOUND:                   'That invite no longer exists.',
  LEADER_CANNOT_LEAVE:         'Remove or promote other members before leaving.',
  CANNOT_REMOVE_SELF:          'Use "Leave squad" to remove yourself.',
  ANNOUNCEMENT_REQUIRES_LEADER: 'Only the squad leader can post announcements.',
  EMPTY_POST:                  'Write something before posting.',
}

function friendlyError(e: unknown): string {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  return errorMessages[code] ?? 'Something went wrong. Please try again.'
}

// Known sentinel codes (NOT_LEADER, ALREADY_IN_SQUAD, etc.) are expected
// control flow — logged at warn. Anything else (a thrown Supabase/Postgres
// error, a bug) is unexpected — logged at error with the full err object.
function logActionOutcome(log: Logger, action: string, e: unknown, context: Record<string, unknown>) {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  if (code in errorMessages) {
    log.warn({ ...context, code }, `${action} rejected`)
  } else {
    log.error({ ...context, err: e }, `${action} failed unexpectedly`)
  }
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function createSquadAction(fields: SquadDetailsInput): Promise<
  { ok: true; squadId: string } | { ok: false; error: string }
> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'createSquad' })

  try {
    const squadId = await createSquad(user.id, fields)
    revalidatePath('/squads')
    log.info({ squadId }, 'Squad created')
    return { ok: true, squadId }
  } catch (e) {
    logActionOutcome(log, 'createSquad', e, {})
    return { ok: false, error: friendlyError(e) }
  }
}

export async function updateSquadAction(squadId: string, fields: SquadDetailsInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'updateSquad', squadId })

  try {
    await updateSquad(user.id, squadId, fields)
    revalidatePath('/squads/' + squadId)
    log.info('Squad details updated')
    return { ok: true }
  } catch (e) {
    logActionOutcome(log, 'updateSquad', e, {})
    return { ok: false, error: friendlyError(e) }
  }
}

export async function inviteToSquadAction(squadId: string, targetUserId: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'inviteToSquad', squadId })

  try {
    await inviteToSquad(user.id, squadId, targetUserId)
    revalidatePath('/squads/' + squadId)
    log.info({ targetUserId }, 'Squad invite sent')
    return { ok: true }
  } catch (e) {
    logActionOutcome(log, 'inviteToSquad', e, { targetUserId })
    return { ok: false, error: friendlyError(e) }
  }
}

export async function respondToInviteAction(squadId: string, accept: boolean): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'respondToInvite', squadId })

  try {
    await respondToInvite(user.id, squadId, accept)
    revalidatePath('/squads')
    revalidatePath('/squads/' + squadId)
    log.info({ accept }, 'Squad invite response recorded')
    return { ok: true }
  } catch (e) {
    logActionOutcome(log, 'respondToInvite', e, { accept })
    return { ok: false, error: friendlyError(e) }
  }
}

export async function leaveSquadAction(squadId: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'leaveSquad', squadId })

  try {
    await leaveSquad(user.id, squadId)
    revalidatePath('/squads')
    log.info('Left squad')
    return { ok: true }
  } catch (e) {
    logActionOutcome(log, 'leaveSquad', e, {})
    return { ok: false, error: friendlyError(e) }
  }
}

export async function removeMemberAction(squadId: string, targetUserId: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'removeMember', squadId })

  try {
    await removeMember(user.id, squadId, targetUserId)
    revalidatePath('/squads/' + squadId)
    log.info({ targetUserId }, 'Squad member removed')
    return { ok: true }
  } catch (e) {
    logActionOutcome(log, 'removeMember', e, { targetUserId })
    return { ok: false, error: friendlyError(e) }
  }
}

export async function postToWallAction(
  squadId: string,
  content: string,
  isAnnouncement: boolean
): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const log = logger.child({ userId: user.id, feature: 'squads', action: 'postToWall', squadId })

  try {
    await postToWall(user.id, squadId, content, isAnnouncement)
    revalidatePath('/squads/' + squadId)
    // Content isn't logged (user-authored text) — length + the announcement
    // flag are what matter operationally, since an announcement fans out a
    // notification to every member.
    log.info({ isAnnouncement, contentLength: content.length }, 'Posted to squad wall')
    return { ok: true }
  } catch (e) {
    logActionOutcome(log, 'postToWall', e, { isAnnouncement })
    return { ok: false, error: friendlyError(e) }
  }
}
