import type { MuscleGroup, Skill, SkillPrerequisite } from '@/types/database'

// A skill counts as unlocked when the user has explicitly unlocked it, or when
// all its prerequisites are unlocked and the muscle-group XP threshold is met
// (skills auto-unlock as conditions are reached — same rule as the skills tree).
export function computeUnlockedSkillIds(
  skills: Skill[],
  prerequisites: SkillPrerequisite[],
  explicitlyUnlockedIds: Set<string>,
  mgXp: Record<MuscleGroup, number>
): Set<string> {
  const prereqMap: Record<string, string[]> = {}
  for (const p of prerequisites) {
    if (!prereqMap[p.skill_id]) prereqMap[p.skill_id] = []
    prereqMap[p.skill_id].push(p.prerequisite_skill_id)
  }

  const unlocked = new Set(explicitlyUnlockedIds)

  // Auto-unlocks can cascade (a newly unlocked skill may satisfy another's
  // prerequisites), so iterate until stable.
  let changed = true
  while (changed) {
    changed = false
    for (const skill of skills) {
      if (unlocked.has(skill.id)) continue
      const prereqsMet = (prereqMap[skill.id] ?? []).every(id => unlocked.has(id))
      const xpMet = (mgXp[skill.muscle_group] ?? 0) >= skill.required_mg_xp
      if (prereqsMet && xpMet) {
        unlocked.add(skill.id)
        changed = true
      }
    }
  }

  return unlocked
}
