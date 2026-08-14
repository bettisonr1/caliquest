import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilder, createSupabaseMock } from '@/test/helpers/supabase-mock'
import {
  acceptInvite,
  createSquadViaRpc,
  deleteMembership,
  getMembership,
  getSquadById,
  getSquadMembers,
  getSquadPosts,
  insertInvite,
  insertPost,
  updateSquadDetails,
} from './squads.repository'

describe('createSquadViaRpc', () => {
  it('calls the create_squad RPC with the given fields and returns the new id', async () => {
    const supabase = createSupabaseMock()
    supabase.rpc.mockResolvedValue({ data: 'squad-1', error: null })

    const id = await createSquadViaRpc(supabase as never, {
      name: 'Bar Crew',
      description: null,
      gym_name: null,
      meeting_info: null,
    })

    expect(supabase.rpc).toHaveBeenCalledWith('create_squad', {
      squad_name: 'Bar Crew',
      squad_description: null,
      squad_gym: null,
      squad_meeting_info: null,
    })
    expect(id).toBe('squad-1')
  })

  it('throws the underlying error when the RPC fails', async () => {
    const supabase = createSupabaseMock()
    const error = new Error('boom')
    supabase.rpc.mockResolvedValue({ data: null, error })

    await expect(
      createSquadViaRpc(supabase as never, { name: 'x', description: null, gym_name: null, meeting_info: null })
    ).rejects.toBe(error)
  })
})

describe('getSquadById', () => {
  it('queries squads by id and returns the row', async () => {
    const squad = { id: 'squad-1', name: 'Bar Crew' }
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: squad, error: null })
    supabase.from.mockReturnValue(builder)

    const result = await getSquadById(supabase as never, 'squad-1')

    expect(supabase.from).toHaveBeenCalledWith('squads')
    expect(builder.select).toHaveBeenCalledWith('*')
    expect(builder.eq).toHaveBeenCalledWith('id', 'squad-1')
    expect(builder.maybeSingle).toHaveBeenCalled()
    expect(result).toEqual(squad)
  })

  it('returns null when no squad matches', async () => {
    const supabase = createSupabaseMock()
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error: null }))

    expect(await getSquadById(supabase as never, 'missing')).toBeNull()
  })
})

describe('updateSquadDetails', () => {
  it('updates the row for the given squad id', async () => {
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    const fields = { name: 'New name', description: null, gym_name: null, meeting_info: null }
    await updateSquadDetails(supabase as never, 'squad-1', fields)

    expect(builder.update).toHaveBeenCalledWith(fields)
    expect(builder.eq).toHaveBeenCalledWith('id', 'squad-1')
  })

  it('throws on a Supabase error', async () => {
    const supabase = createSupabaseMock()
    const error = new Error('db error')
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error }))

    await expect(
      updateSquadDetails(supabase as never, 'squad-1', { name: 'x', description: null, gym_name: null, meeting_info: null })
    ).rejects.toBe(error)
  })
})

describe('getSquadMembers / getMembership', () => {
  it('lists members for a squad, ordered by creation', async () => {
    const members = [{ squad_id: 's1', user_id: 'u1' }]
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: members, error: null })
    supabase.from.mockReturnValue(builder)

    const result = await getSquadMembers(supabase as never, 's1')

    expect(supabase.from).toHaveBeenCalledWith('squad_members')
    expect(builder.eq).toHaveBeenCalledWith('squad_id', 's1')
    expect(builder.order).toHaveBeenCalledWith('created_at')
    expect(result).toEqual(members)
  })

  it('defaults to an empty array when the query returns null data', async () => {
    const supabase = createSupabaseMock()
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error: null }))

    expect(await getSquadMembers(supabase as never, 's1')).toEqual([])
  })

  it('looks up a single membership by squad and user', async () => {
    const membership = { squad_id: 's1', user_id: 'u1', role: 'member', status: 'active' }
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: membership, error: null })
    supabase.from.mockReturnValue(builder)

    const result = await getMembership(supabase as never, 's1', 'u1')

    expect(builder.eq).toHaveBeenNthCalledWith(1, 'squad_id', 's1')
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'user_id', 'u1')
    expect(result).toEqual(membership)
  })
})

describe('insertInvite', () => {
  it('inserts an invited membership row', async () => {
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    await insertInvite(supabase as never, 's1', 'target-user', 'inviter')

    expect(builder.insert).toHaveBeenCalledWith({
      squad_id: 's1',
      user_id: 'target-user',
      role: 'member',
      status: 'invited',
      invited_by: 'inviter',
    })
  })

  it('swallows a 23505 (already invited/member) unique-violation', async () => {
    const supabase = createSupabaseMock()
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error: { code: '23505' } }))

    await expect(insertInvite(supabase as never, 's1', 'target-user', 'inviter')).resolves.toBeUndefined()
  })

  it('rethrows any other error', async () => {
    const supabase = createSupabaseMock()
    const error = { code: '42501', message: 'permission denied' }
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error }))

    await expect(insertInvite(supabase as never, 's1', 'target-user', 'inviter')).rejects.toBe(error)
  })
})

describe('acceptInvite / deleteMembership', () => {
  it('activates a membership and stamps joined_at', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-14T12:00:00.000Z'))
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    await acceptInvite(supabase as never, 's1', 'u1')

    expect(builder.update).toHaveBeenCalledWith({ status: 'active', joined_at: '2026-08-14T12:00:00.000Z' })
    vi.useRealTimers()
  })

  it('deletes the membership row for the squad/user pair', async () => {
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    await deleteMembership(supabase as never, 's1', 'u1')

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'squad_id', 's1')
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'user_id', 'u1')
  })
})

describe('getSquadPosts / insertPost', () => {
  it('fetches posts newest-first, capped at the given limit', async () => {
    const posts = [{ id: 'p1' }]
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: posts, error: null })
    supabase.from.mockReturnValue(builder)

    const result = await getSquadPosts(supabase as never, 's1', 10)

    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(builder.limit).toHaveBeenCalledWith(10)
    expect(result).toEqual(posts)
  })

  it('inserts a wall post with the given fields', async () => {
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    await insertPost(supabase as never, 's1', 'u1', 'Great session today', true)

    expect(builder.insert).toHaveBeenCalledWith({
      squad_id: 's1',
      author_id: 'u1',
      content: 'Great session today',
      is_announcement: true,
    })
  })
})
