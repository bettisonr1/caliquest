import { createClient } from '@/lib/supabase/server'
import {
  getAllSkills,
  getSkillPrerequisites,
  insertUserSkills,
} from '@/lib/repositories/skills.repository'
import {
  claimOnboarding,
  getMuscleGroupXP,
  getProfile,
  updateMuscleGroupXP,
} from '@/lib/repositories/profiles.repository'
import { expandWithPrerequisites, seedDeltas, starterSkillIds } from '@/lib/onboarding'
import { xpToLevel } from '@/lib/xp'

export type OnboardingOutcome = {
  level: number
  totalXp: number
  xpSeeded: number
  skillsRecorded: number
}

export async function completeOnboarding(
  userId: string,
  claimedSkillIds: string[]
): Promise<OnboardingOutcome> {
  const supabase = await createClient()

  const [skills, prerequisites, profile, mgXp] = await Promise.all([
    getAllSkills(supabase),
    getSkillPrerequisites(supabase),
    getProfile(supabase, userId),
    getMuscleGroupXP(supabase, userId),
  ])
  if (profile.onboarded_at) throw new Error('ALREADY_ONBOARDED')

  const skillById = new Map(skills.map(s => [s.id, s]))
  for (const id of claimedSkillIds) {
    if (!skillById.has(id)) throw new Error('SKILL_NOT_FOUND')
  }

  const recordedIds = expandWithPrerequisites(
    [...claimedSkillIds, ...starterSkillIds(skills, prerequisites)],
    prerequisites
  )
  const { deltas, xpSeeded } = seedDeltas(recordedIds, skillById, mgXp)

  const newTotalXp = profile.total_xp + xpSeeded
  const newLevel = xpToLevel(newTotalXp)

  // The conditional profile update is the idempotency gate: if another request
  // onboarded this user first, stop before touching XP or skills.
  const claimed = await claimOnboarding(supabase, userId, {
    total_xp: newTotalXp,
    level: newLevel,
    onboarding_xp: xpSeeded,
  })
  if (!claimed) throw new Error('ALREADY_ONBOARDED')

  for (const { group, newXp } of deltas) {
    await updateMuscleGroupXP(supabase, userId, group, newXp)
  }
  await insertUserSkills(supabase, userId, [...recordedIds])

  return {
    level: newLevel,
    totalXp: newTotalXp,
    xpSeeded,
    skillsRecorded: recordedIds.size,
  }
}
