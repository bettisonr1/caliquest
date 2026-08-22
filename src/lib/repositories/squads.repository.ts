import type { SupabaseClient } from '@supabase/supabase-js'
import type { Squad, SquadMember, SquadMembershipWithSquad, SquadPost } from '@/types/database'

export async function createSquadViaRpc(
  supabase: SupabaseClient,
  fields: { name: string; description: string | null; gym_name: string | null; meeting_info: string | null }
) {
  const { data, error } = await supabase.rpc('create_squad', {
    squad_name: fields.name,
    squad_description: fields.description,
    squad_gym: fields.gym_name,
    squad_meeting_info: fields.meeting_info,
  })
  if (error) throw error
  return data as string
}

export async function getSquadById(supabase: SupabaseClient, squadId: string) {
  const { data, error } = await supabase
    .from('squads')
    .select('*')
    .eq('id', squadId)
    .maybeSingle()
  if (error) throw error
  return data as Squad | null
}

export async function updateSquadDetails(
  supabase: SupabaseClient,
  squadId: string,
  fields: { name: string; description: string | null; gym_name: string | null; meeting_info: string | null }
) {
  const { error } = await supabase
    .from('squads')
    .update(fields)
    .eq('id', squadId)
  if (error) throw error
}

export async function getMembershipsForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('squad_members')
    .select('*, squads(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as SquadMembershipWithSquad[]
}

export async function getSquadMembers(supabase: SupabaseClient, squadId: string) {
  const { data, error } = await supabase
    .from('squad_members')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as SquadMember[]
}

// Batched alternative to calling getSquadMembers once per squad just to
// count active members (the squads list page previously did exactly that,
// one round trip per squad the user is in).
export async function getActiveMemberCountsBySquadId(
  supabase: SupabaseClient,
  squadIds: string[]
): Promise<Record<string, number>> {
  if (squadIds.length === 0) return {}
  const { data, error } = await supabase
    .from('squad_members')
    .select('squad_id')
    .in('squad_id', squadIds)
    .eq('status', 'active')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.squad_id] = (counts[row.squad_id] ?? 0) + 1
  }
  return counts
}

export async function getMembership(supabase: SupabaseClient, squadId: string, userId: string) {
  const { data, error } = await supabase
    .from('squad_members')
    .select('*')
    .eq('squad_id', squadId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as SquadMember | null
}

export async function insertInvite(
  supabase: SupabaseClient,
  squadId: string,
  targetUserId: string,
  invitedBy: string
) {
  const { error } = await supabase
    .from('squad_members')
    .insert({
      squad_id: squadId,
      user_id: targetUserId,
      role: 'member',
      status: 'invited',
      invited_by: invitedBy,
    })
  // 23505 = already invited/member (double click) — treat as success
  if (error && error.code !== '23505') throw error
}

export async function acceptInvite(supabase: SupabaseClient, squadId: string, userId: string) {
  const { error } = await supabase
    .from('squad_members')
    .update({ status: 'active', joined_at: new Date().toISOString() })
    .eq('squad_id', squadId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteMembership(supabase: SupabaseClient, squadId: string, userId: string) {
  const { error } = await supabase
    .from('squad_members')
    .delete()
    .eq('squad_id', squadId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getSquadPosts(supabase: SupabaseClient, squadId: string, limit = 50) {
  const { data, error } = await supabase
    .from('squad_posts')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SquadPost[]
}

export async function insertPost(
  supabase: SupabaseClient,
  squadId: string,
  authorId: string,
  content: string,
  isAnnouncement: boolean
) {
  const { error } = await supabase
    .from('squad_posts')
    .insert({
      squad_id: squadId,
      author_id: authorId,
      content,
      is_announcement: isAnnouncement,
    })
  if (error) throw error
}
