import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '@/test/helpers/supabase-mock'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/repositories/squads.repository')
vi.mock('@/lib/repositories/friendships.repository')

import { createClient } from '@/lib/supabase/server'
import * as squadsRepo from '@/lib/repositories/squads.repository'
import * as friendshipsRepo from '@/lib/repositories/friendships.repository'
import {
  createSquad,
  inviteToSquad,
  leaveSquad,
  postToWall,
  removeMember,
  respondToInvite,
  updateSquad,
} from './squads.service'

const activeLeader = { squad_id: 's1', user_id: 'leader', role: 'leader', status: 'active' } as never
const activeMember = { squad_id: 's1', user_id: 'member', role: 'member', status: 'active' } as never

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue(createSupabaseMock() as never)
})

describe('createSquad', () => {
  it('rejects a blank name without hitting the database', async () => {
    await expect(createSquad('u1', { name: '   ' })).rejects.toThrow('NAME_REQUIRED')
    expect(squadsRepo.createSquadViaRpc).not.toHaveBeenCalled()
  })

  it('trims the name and passes cleaned optional fields through to the RPC', async () => {
    vi.mocked(squadsRepo.createSquadViaRpc).mockResolvedValue('squad-1')

    const id = await createSquad('u1', { name: '  Bar Crew  ', description: '  ', gym_name: 'Muscle Beach' })

    expect(squadsRepo.createSquadViaRpc).toHaveBeenCalledWith(expect.anything(), {
      name: 'Bar Crew',
      description: null,
      gym_name: 'Muscle Beach',
      meeting_info: null,
    })
    expect(id).toBe('squad-1')
  })
})

describe('updateSquad', () => {
  it('rejects when the caller is not an active member', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(null)

    await expect(updateSquad('u1', 's1', { name: 'x' })).rejects.toThrow('NOT_A_MEMBER')
  })

  it('rejects when the caller is a member but not the leader', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await expect(updateSquad('member', 's1', { name: 'x' })).rejects.toThrow('NOT_LEADER')
    expect(squadsRepo.updateSquadDetails).not.toHaveBeenCalled()
  })

  it('lets the leader update the squad details', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeLeader)

    await updateSquad('leader', 's1', { name: ' New name ' })

    expect(squadsRepo.updateSquadDetails).toHaveBeenCalledWith(expect.anything(), 's1', {
      name: 'New name',
      description: null,
      gym_name: null,
      meeting_info: null,
    })
  })
})

describe('inviteToSquad', () => {
  it('rejects a non-leader inviter', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await expect(inviteToSquad('member', 's1', 'target')).rejects.toThrow('NOT_LEADER')
  })

  it('rejects inviting someone who is not an accepted friend', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeLeader)
    vi.mocked(friendshipsRepo.findFriendshipBetween).mockResolvedValue(null)

    await expect(inviteToSquad('leader', 's1', 'target')).rejects.toThrow('NOT_FRIENDS')
  })

  it('rejects inviting someone already in the squad', async () => {
    vi.mocked(squadsRepo.getMembership)
      .mockResolvedValueOnce(activeLeader) // inviter's own membership
      .mockResolvedValueOnce(activeMember) // target already has a membership row
    vi.mocked(friendshipsRepo.findFriendshipBetween).mockResolvedValue({ status: 'accepted' } as never)

    await expect(inviteToSquad('leader', 's1', 'member')).rejects.toThrow('ALREADY_IN_SQUAD')
    expect(squadsRepo.insertInvite).not.toHaveBeenCalled()
  })

  it('invites an accepted friend who is not yet a member', async () => {
    vi.mocked(squadsRepo.getMembership)
      .mockResolvedValueOnce(activeLeader)
      .mockResolvedValueOnce(null)
    vi.mocked(friendshipsRepo.findFriendshipBetween).mockResolvedValue({ status: 'accepted' } as never)

    await inviteToSquad('leader', 's1', 'target')

    expect(squadsRepo.insertInvite).toHaveBeenCalledWith(expect.anything(), 's1', 'target', 'leader')
  })
})

describe('respondToInvite', () => {
  it('rejects when there is no pending invite', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(null)

    await expect(respondToInvite('u1', 's1', true)).rejects.toThrow('NOT_FOUND')
  })

  it('accepts the invite', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue({ status: 'invited' } as never)

    await respondToInvite('u1', 's1', true)

    expect(squadsRepo.acceptInvite).toHaveBeenCalledWith(expect.anything(), 's1', 'u1')
    expect(squadsRepo.deleteMembership).not.toHaveBeenCalled()
  })

  it('deletes the membership row when declining', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue({ status: 'invited' } as never)

    await respondToInvite('u1', 's1', false)

    expect(squadsRepo.deleteMembership).toHaveBeenCalledWith(expect.anything(), 's1', 'u1')
    expect(squadsRepo.acceptInvite).not.toHaveBeenCalled()
  })
})

describe('leaveSquad', () => {
  it('lets a regular member leave freely', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await leaveSquad('member', 's1')

    expect(squadsRepo.deleteMembership).toHaveBeenCalledWith(expect.anything(), 's1', 'member')
  })

  it('blocks the leader from leaving while other members remain', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeLeader)
    vi.mocked(squadsRepo.getSquadMembers).mockResolvedValue([activeLeader, activeMember])

    await expect(leaveSquad('leader', 's1')).rejects.toThrow('LEADER_CANNOT_LEAVE')
    expect(squadsRepo.deleteMembership).not.toHaveBeenCalled()
  })

  it('lets the leader leave once they are the last member', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeLeader)
    vi.mocked(squadsRepo.getSquadMembers).mockResolvedValue([activeLeader])

    await leaveSquad('leader', 's1')

    expect(squadsRepo.deleteMembership).toHaveBeenCalledWith(expect.anything(), 's1', 'leader')
  })
})

describe('removeMember', () => {
  it('rejects a non-leader trying to remove someone', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await expect(removeMember('member', 's1', 'other')).rejects.toThrow('NOT_LEADER')
  })

  it('rejects the leader trying to remove themselves', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeLeader)

    await expect(removeMember('leader', 's1', 'leader')).rejects.toThrow('CANNOT_REMOVE_SELF')
  })

  it('lets the leader remove another member', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeLeader)

    await removeMember('leader', 's1', 'member')

    expect(squadsRepo.deleteMembership).toHaveBeenCalledWith(expect.anything(), 's1', 'member')
  })
})

describe('postToWall', () => {
  it('rejects a non-member', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(null)

    await expect(postToWall('u1', 's1', 'hey', false)).rejects.toThrow('NOT_A_MEMBER')
  })

  it('rejects an announcement from a non-leader', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await expect(postToWall('member', 's1', 'hey', true)).rejects.toThrow('ANNOUNCEMENT_REQUIRES_LEADER')
  })

  it('rejects an empty (whitespace-only) post', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await expect(postToWall('member', 's1', '   ', false)).rejects.toThrow('EMPTY_POST')
    expect(squadsRepo.insertPost).not.toHaveBeenCalled()
  })

  it('trims content and inserts the post', async () => {
    vi.mocked(squadsRepo.getMembership).mockResolvedValue(activeMember)

    await postToWall('member', 's1', '  great session today  ', false)

    expect(squadsRepo.insertPost).toHaveBeenCalledWith(expect.anything(), 's1', 'member', 'great session today', false)
  })
})
