import { createClient } from '@/lib/supabase/server'
import {
  getAllSkills,
  getSkillById,
  getSkillPrerequisites,
  getUserUnlockedSkillIds,
  insertUserSkill,
} from '@/lib/repositories/skills.repository'
import { getExercisesBySkillId } from '@/lib/repositories/exercises.repository'
import { getMuscleGroupXP } from '@/lib/repositories/profiles.repository'
import type { Exercise, MuscleGroup, SkillPrerequisite, SkillWithStatus } from '@/types/database'

export function isSkillEligible(
  skill: Pick<SkillWithStatus, 'muscle_group' | 'required_mg_xp'>,
  prereqIds: string[],
  unlockedIds: Set<string>,
  mgXp: Record<MuscleGroup, number>,
): boolean {
  const prereqsMet = prereqIds.every(id => unlockedIds.has(id))
  const xpMet = (mgXp[skill.muscle_group] ?? 0) >= skill.required_mg_xp
  return prereqsMet && xpMet
}

export async function getSkillsWithStatus(userId: string): Promise<{
  skills: SkillWithStatus[]
  mgXp: Record<MuscleGroup, number>
}> {
  const supabase = await createClient()

  const [skills, prerequisites, unlockedIds, mgXp] = await Promise.all([
    getAllSkills(supabase),
    getSkillPrerequisites(supabase),
    getUserUnlockedSkillIds(supabase, userId),
    getMuscleGroupXP(supabase, userId),
  ])

  const prereqMap: Record<string, string[]> = {}
  for (const p of prerequisites as SkillPrerequisite[]) {
    if (!prereqMap[p.skill_id]) prereqMap[p.skill_id] = []
    prereqMap[p.skill_id].push(p.prerequisite_skill_id)
  }

  const skillsWithStatus: SkillWithStatus[] = skills.map(skill => {
    const prereqIds = prereqMap[skill.id] ?? []
    const prereqsMet = prereqIds.every(id => unlockedIds.has(id))
    const userXp = mgXp[skill.muscle_group as MuscleGroup] ?? 0
    const eligible = isSkillEligible(skill, prereqIds, unlockedIds, mgXp)

    let status: SkillWithStatus['status']
    if (unlockedIds.has(skill.id) || eligible) {
      status = 'unlocked'
    } else if (prereqsMet) {
      status = 'in_progress'
    } else {
      status = 'locked'
    }

    return { ...skill, status, prerequisite_ids: prereqIds, user_mg_xp: userXp, is_recorded: unlockedIds.has(skill.id) }
  })

  return { skills: skillsWithStatus, mgXp }
}

export type SkillDetail = {
  skill:         SkillWithStatus
  prerequisites: SkillWithStatus[]
  // Skills that list this one as a prerequisite — what training this unlocks next.
  unlocks:       SkillWithStatus[]
  exercises:     Exercise[]
}

export async function getSkillDetail(userId: string, skillId: string): Promise<SkillDetail | null> {
  const supabase = await createClient()

  const [{ skills }, prerequisites, exercises] = await Promise.all([
    getSkillsWithStatus(userId),
    getSkillPrerequisites(supabase),
    getExercisesBySkillId(supabase, skillId),
  ])

  const skill = skills.find(s => s.id === skillId)
  if (!skill) return null

  const byId = new Map(skills.map(s => [s.id, s]))
  const prerequisiteSkills = skill.prerequisite_ids
    .map(id => byId.get(id))
    .filter((s): s is SkillWithStatus => s !== undefined)
  const unlockSkills = prerequisites
    .filter(p => p.prerequisite_skill_id === skillId)
    .map(p => byId.get(p.skill_id))
    .filter((s): s is SkillWithStatus => s !== undefined)

  return { skill, prerequisites: prerequisiteSkills, unlocks: unlockSkills, exercises }
}

export async function unlockSkill(userId: string, skillId: string): Promise<void> {
  const supabase = await createClient()

  const skill = await getSkillById(supabase, skillId)
  if (!skill) throw new Error('SKILL_NOT_FOUND')

  const unlockedIds = await getUserUnlockedSkillIds(supabase, userId)
  if (unlockedIds.has(skillId)) return

  const [prerequisites, mgXp] = await Promise.all([
    getSkillPrerequisites(supabase),
    getMuscleGroupXP(supabase, userId),
  ])
  const prereqIds = (prerequisites as SkillPrerequisite[])
    .filter(p => p.skill_id === skillId)
    .map(p => p.prerequisite_skill_id)

  if (!isSkillEligible(skill, prereqIds, unlockedIds, mgXp)) {
    throw new Error('SKILL_NOT_ELIGIBLE')
  }

  await insertUserSkill(supabase, userId, skillId)
}
