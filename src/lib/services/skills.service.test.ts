import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '@/test/helpers/supabase-mock'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/repositories/skills.repository')
vi.mock('@/lib/repositories/profiles.repository')

import { createClient } from '@/lib/supabase/server'
import * as skillsRepo from '@/lib/repositories/skills.repository'
import * as profilesRepo from '@/lib/repositories/profiles.repository'
import { getSkillsWithStatus, isSkillEligible, unlockSkill } from './skills.service'

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue(createSupabaseMock() as never)
})

describe('isSkillEligible', () => {
  const skill = { muscle_group: 'push' as const, required_mg_xp: 100 }

  it('requires every prerequisite to be unlocked', () => {
    const unlocked = new Set(['a'])
    expect(isSkillEligible(skill, ['a', 'b'], unlocked, { push: 200 } as never)).toBe(false)
  })

  it('requires enough muscle-group xp', () => {
    const unlocked = new Set<string>()
    expect(isSkillEligible(skill, [], unlocked, { push: 50 } as never)).toBe(false)
    expect(isSkillEligible(skill, [], unlocked, { push: 100 } as never)).toBe(true)
  })

  it('treats a missing muscle-group xp entry as zero', () => {
    expect(isSkillEligible(skill, [], new Set(), {} as never)).toBe(false)
  })
})

describe('getSkillsWithStatus', () => {
  it('classifies skills as unlocked / in_progress / locked', async () => {
    const skills = [
      { id: 'recorded', muscle_group: 'push', required_mg_xp: 0 },
      { id: 'ready', muscle_group: 'push', required_mg_xp: 100 },
      { id: 'blocked-by-prereq', muscle_group: 'push', required_mg_xp: 0 },
      { id: 'blocked-by-xp', muscle_group: 'push', required_mg_xp: 500 },
    ] as never[]
    vi.mocked(skillsRepo.getAllSkills).mockResolvedValue(skills)
    vi.mocked(skillsRepo.getSkillPrerequisites).mockResolvedValue([
      // requires "blocked-by-xp", which is never unlocked in this scenario
      { skill_id: 'blocked-by-prereq', prerequisite_skill_id: 'blocked-by-xp' },
    ] as never)
    vi.mocked(skillsRepo.getUserUnlockedSkillIds).mockResolvedValue(new Set(['recorded']))
    vi.mocked(profilesRepo.getMuscleGroupXP).mockResolvedValue({ push: 100 } as never)

    const { skills: result } = await getSkillsWithStatus('u1')
    const byId = Object.fromEntries(result.map(s => [s.id, s.status]))

    expect(byId).toEqual({
      recorded: 'unlocked',            // already recorded as unlocked
      ready: 'unlocked',                // no prereqs, xp threshold met
      'blocked-by-prereq': 'locked',    // its prereq is not unlocked
      'blocked-by-xp': 'in_progress',   // no prereqs, but xp threshold not met
    })
  })
})

describe('unlockSkill', () => {
  it('throws SKILL_NOT_FOUND for an unknown skill id', async () => {
    vi.mocked(skillsRepo.getSkillById).mockResolvedValue(null)

    await expect(unlockSkill('u1', 'missing')).rejects.toThrow('SKILL_NOT_FOUND')
  })

  it('is a no-op when the skill is already unlocked', async () => {
    vi.mocked(skillsRepo.getSkillById).mockResolvedValue({ id: 's1' } as never)
    vi.mocked(skillsRepo.getUserUnlockedSkillIds).mockResolvedValue(new Set(['s1']))

    await unlockSkill('u1', 's1')

    expect(skillsRepo.insertUserSkill).not.toHaveBeenCalled()
  })

  it('rejects unlocking a skill whose prerequisites/xp are not met', async () => {
    vi.mocked(skillsRepo.getSkillById).mockResolvedValue({ id: 's1', muscle_group: 'push', required_mg_xp: 500 } as never)
    vi.mocked(skillsRepo.getUserUnlockedSkillIds).mockResolvedValue(new Set())
    vi.mocked(skillsRepo.getSkillPrerequisites).mockResolvedValue([])
    vi.mocked(profilesRepo.getMuscleGroupXP).mockResolvedValue({ push: 0 } as never)

    await expect(unlockSkill('u1', 's1')).rejects.toThrow('SKILL_NOT_ELIGIBLE')
    expect(skillsRepo.insertUserSkill).not.toHaveBeenCalled()
  })

  it('records the unlock once prerequisites and xp are satisfied', async () => {
    vi.mocked(skillsRepo.getSkillById).mockResolvedValue({ id: 's1', muscle_group: 'push', required_mg_xp: 100 } as never)
    vi.mocked(skillsRepo.getUserUnlockedSkillIds).mockResolvedValue(new Set())
    vi.mocked(skillsRepo.getSkillPrerequisites).mockResolvedValue([])
    vi.mocked(profilesRepo.getMuscleGroupXP).mockResolvedValue({ push: 100 } as never)

    await unlockSkill('u1', 's1')

    expect(skillsRepo.insertUserSkill).toHaveBeenCalledWith(expect.anything(), 'u1', 's1')
  })
})
