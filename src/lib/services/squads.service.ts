import { createClient } from '@/lib/supabase/server'
import {
  acceptInvite,
  createSquadViaRpc,
  deleteMembership,
  getMembership,
  getMembershipsForUser,
  getSquadById,
  getSquadMembers,
  getSquadPosts,
  insertInvite,
  insertPost,
  updateSquadDetails,
} from '@/lib/repositories/squads.repository'
import { findFriendshipBetween, getAcceptedFriendships } from '@/lib/repositories/friendships.repository'
import { getProfilesByUserIds } from '@/lib/repositories/profiles.repository'
import type {
  Profile,
  PublicProfile,
  Squad,
  SquadMembershipWithSquad,
  SquadMemberWithProfile,
  SquadPostWithAuthor,
} from '@/types/database'

const MAX_NAME_CHARS = 60
const MAX_TEXT_CHARS = 300
const MAX_POST_CHARS = 1000

export type SquadListEntry = {
  membership: SquadMembershipWithSquad
  memberCount: number
}

export type SquadsPageData = {
  mySquads: SquadListEntry[]
  invites: SquadMembershipWithSquad[]
}

export async function getSquadsPageData(userId: string): Promise<SquadsPageData> {
  const supabase = await createClient()
  const memberships = await getMembershipsForUser(supabase, userId)

  const active = memberships.filter(m => m.status === 'active')
  const mySquads = await Promise.all(
    active.map(async membership => {
      const members = await getSquadMembers(supabase, membership.squad_id)
      return { membership, memberCount: members.filter(m => m.status === 'active').length }
    })
  )

  return {
    mySquads,
    invites: memberships.filter(m => m.status === 'invited'),
  }
}

export type SquadWallData = {
  squad: Squad
  role: 'leader' | 'member'
  members: SquadMemberWithProfile[]
  posts: SquadPostWithAuthor[]
  invitableFriends: PublicProfile[]
}

export async function getSquadWall(userId: string, squadId: string): Promise<SquadWallData> {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER')

  const [squad, memberRows, posts] = await Promise.all([
    getSquadById(supabase, squadId),
    getSquadMembers(supabase, squadId),
    getSquadPosts(supabase, squadId),
  ])
  if (!squad) throw new Error('NOT_FOUND')

  // Batch-hydrate profiles in one query (profiles RLS forbids SQL joins).
  const profileIds = new Set<string>(memberRows.map(m => m.user_id))
  for (const post of posts) profileIds.add(post.author_id)

  const isLeader = membership.role === 'leader'
  let friendIds: string[] = []
  if (isLeader) {
    const friendships = await getAcceptedFriendships(supabase, userId)
    friendIds = friendships.map(f => (f.requester_id === userId ? f.addressee_id : f.requester_id))
    for (const id of friendIds) profileIds.add(id)
  }

  const profiles = await getProfilesByUserIds(supabase, [...profileIds])
  const profileById = new Map(profiles.map(p => [p.user_id, p]))

  const memberIds = new Set(memberRows.map(m => m.user_id))

  return {
    squad,
    role: membership.role,
    members: memberRows
      .map(m => ({ ...m, profile: profileById.get(m.user_id) }))
      .filter((m): m is SquadMemberWithProfile => m.profile !== undefined),
    posts: posts.map(p => ({ ...p, author: profileById.get(p.author_id) ?? null })),
    invitableFriends: friendIds
      .filter(id => !memberIds.has(id))
      .map(id => profileById.get(id))
      .filter((p): p is Profile => p !== undefined),
  }
}

function cleanOptional(value: string | null | undefined, maxChars: number): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed.slice(0, maxChars)
}

export type SquadDetailsInput = {
  name: string
  description?: string | null
  gym_name?: string | null
  meeting_info?: string | null
}

export async function createSquad(userId: string, fields: SquadDetailsInput): Promise<string> {
  const supabase = await createClient()

  const name = fields.name?.trim().slice(0, MAX_NAME_CHARS) ?? ''
  if (name === '') throw new Error('NAME_REQUIRED')

  return createSquadViaRpc(supabase, {
    name,
    description: cleanOptional(fields.description, MAX_TEXT_CHARS),
    gym_name: cleanOptional(fields.gym_name, MAX_TEXT_CHARS),
    meeting_info: cleanOptional(fields.meeting_info, MAX_TEXT_CHARS),
  })
}

export async function updateSquad(userId: string, squadId: string, fields: SquadDetailsInput) {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER')
  if (membership.role !== 'leader') throw new Error('NOT_LEADER')

  const name = fields.name?.trim().slice(0, MAX_NAME_CHARS) ?? ''
  if (name === '') throw new Error('NAME_REQUIRED')

  await updateSquadDetails(supabase, squadId, {
    name,
    description: cleanOptional(fields.description, MAX_TEXT_CHARS),
    gym_name: cleanOptional(fields.gym_name, MAX_TEXT_CHARS),
    meeting_info: cleanOptional(fields.meeting_info, MAX_TEXT_CHARS),
  })
}

export async function inviteToSquad(userId: string, squadId: string, targetUserId: string) {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER')
  if (membership.role !== 'leader') throw new Error('NOT_LEADER')

  const friendship = await findFriendshipBetween(supabase, userId, targetUserId)
  if (!friendship || friendship.status !== 'accepted') throw new Error('NOT_FRIENDS')

  const existing = await getMembership(supabase, squadId, targetUserId)
  if (existing) throw new Error('ALREADY_IN_SQUAD')

  await insertInvite(supabase, squadId, targetUserId, userId)
}

export async function respondToInvite(userId: string, squadId: string, accept: boolean) {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'invited') throw new Error('NOT_FOUND')

  if (accept) {
    await acceptInvite(supabase, squadId, userId)
  } else {
    await deleteMembership(supabase, squadId, userId)
  }
}

export async function leaveSquad(userId: string, squadId: string) {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER')

  if (membership.role === 'leader') {
    const members = await getSquadMembers(supabase, squadId)
    const others = members.filter(m => m.user_id !== userId)
    if (others.length > 0) throw new Error('LEADER_CANNOT_LEAVE')
  }

  await deleteMembership(supabase, squadId, userId)
}

export async function removeMember(userId: string, squadId: string, targetUserId: string) {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER')
  if (membership.role !== 'leader') throw new Error('NOT_LEADER')
  if (targetUserId === userId) throw new Error('CANNOT_REMOVE_SELF')

  await deleteMembership(supabase, squadId, targetUserId)
}

export async function postToWall(
  userId: string,
  squadId: string,
  content: string,
  isAnnouncement: boolean
) {
  const supabase = await createClient()

  const membership = await getMembership(supabase, squadId, userId)
  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER')
  if (isAnnouncement && membership.role !== 'leader') throw new Error('ANNOUNCEMENT_REQUIRES_LEADER')

  const trimmed = content.trim().slice(0, MAX_POST_CHARS)
  if (trimmed === '') throw new Error('EMPTY_POST')

  await insertPost(supabase, squadId, userId, trimmed, isAnnouncement)
}
