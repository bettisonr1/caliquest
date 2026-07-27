import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SkillsTree } from '@/components/skills/SkillsTree'
import type { MuscleGroup, Skill, SkillPrerequisite, SkillWithStatus } from '@/types/database'

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: skills },
    { data: prerequisites },
    { data: userSkills },
    { data: mgXpRows },
  ] = await Promise.all([
    supabase.from('skills').select('*').order('sort_order'),
    supabase.from('skill_prerequisites').select('*'),
    supabase.from('user_skills').select('skill_id').eq('user_id', user.id),
    supabase.from('muscle_group_xp').select('*').eq('user_id', user.id),
  ])

  const unlockedIds = new Set((userSkills ?? []).map(r => r.skill_id))

  const mgXp = Object.fromEntries(
    (mgXpRows ?? []).map(r => [r.muscle_group, r.xp])
  ) as Record<MuscleGroup, number>

  // Build prerequisite map: skill_id → [prerequisite_skill_ids]
  const prereqMap: Record<string, string[]> = {}
  for (const p of (prerequisites ?? []) as SkillPrerequisite[]) {
    if (!prereqMap[p.skill_id]) prereqMap[p.skill_id] = []
    prereqMap[p.skill_id].push(p.prerequisite_skill_id)
  }

  const skillsWithStatus: SkillWithStatus[] = (skills ?? [] as Skill[]).map(skill => {
    const prereqIds = prereqMap[skill.id] ?? []
    const prereqsMet = prereqIds.every(id => unlockedIds.has(id))
    const userXp = mgXp[skill.muscle_group as MuscleGroup] ?? 0
    const xpMet = userXp >= skill.required_mg_xp

    let status: SkillWithStatus['status']
    if (unlockedIds.has(skill.id)) {
      status = 'unlocked'
    } else if (prereqsMet && xpMet) {
      status = 'unlocked' // auto-unlock when conditions met (UI shows as unlocked)
    } else if (prereqsMet) {
      status = 'in_progress' // working toward XP threshold
    } else {
      status = 'locked'
    }

    return {
      ...skill,
      status,
      prerequisite_ids: prereqIds,
      user_mg_xp: userXp,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Skills Tree</h1>
        <p className="text-gray-400 text-sm mt-1">
          Unlock new movements as you earn XP in each muscle group.
        </p>
      </div>
      <SkillsTree skills={skillsWithStatus} mgXp={mgXp} />
    </div>
  )
}
