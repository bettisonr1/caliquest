import type { MuscleGroup, Skill, SkillPrerequisite } from '@/types/database'

// A claimed skill implies every skill in its prerequisite chain.
export function expandWithPrerequisites(
  skillIds: string[],
  prerequisites: SkillPrerequisite[]
): Set<string> {
  const prereqMap = new Map<string, string[]>()
  for (const p of prerequisites) {
    const list = prereqMap.get(p.skill_id) ?? []
    list.push(p.prerequisite_skill_id)
    prereqMap.set(p.skill_id, list)
  }

  const result = new Set<string>()
  const stack = [...skillIds]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (result.has(id)) continue
    result.add(id)
    for (const pre of prereqMap.get(id) ?? []) stack.push(pre)
  }
  return result
}

// Entry-point skills (no prerequisites, 0 XP required) are recorded for
// everyone so a brand-new user can log a workout on day one.
export function starterSkillIds(skills: Skill[], prerequisites: SkillPrerequisite[]): string[] {
  const hasPrereq = new Set(prerequisites.map(p => p.skill_id))
  return skills
    .filter(s => s.required_mg_xp === 0 && !hasPrereq.has(s.id))
    .map(s => s.id)
}

// Muscle-group XP is seeded to the highest required_mg_xp among the recorded
// skills in each group — a top-up delta over existing XP, never a reduction.
export function seedDeltas(
  recordedIds: Set<string>,
  skillById: Map<string, Skill>,
  mgXp: Record<MuscleGroup, number>
): { deltas: Array<{ group: MuscleGroup; newXp: number }>; xpSeeded: number } {
  const thresholdByGroup: Partial<Record<MuscleGroup, number>> = {}
  for (const id of recordedIds) {
    const skill = skillById.get(id)
    if (!skill) continue
    const current = thresholdByGroup[skill.muscle_group] ?? 0
    thresholdByGroup[skill.muscle_group] = Math.max(current, skill.required_mg_xp)
  }

  let xpSeeded = 0
  const deltas: Array<{ group: MuscleGroup; newXp: number }> = []
  for (const [group, threshold] of Object.entries(thresholdByGroup) as [MuscleGroup, number][]) {
    const delta = Math.max(0, threshold - (mgXp[group] ?? 0))
    if (delta > 0) {
      xpSeeded += delta
      deltas.push({ group, newXp: (mgXp[group] ?? 0) + delta })
    }
  }
  return { deltas, xpSeeded }
}
