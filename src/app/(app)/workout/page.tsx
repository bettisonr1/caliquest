import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeUnlockedSkillIds } from '@/lib/skills'
import { WorkoutBuilder } from '@/components/workout/WorkoutBuilder'
import type { Exercise, MuscleGroup, Skill, SkillPrerequisite } from '@/types/database'

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: exercises },
    { data: skills },
    { data: prerequisites },
    { data: userSkills },
    { data: mgXpRows },
  ] = await Promise.all([
    supabase.from('exercises').select('*').order('name'),
    supabase.from('skills').select('*'),
    supabase.from('skill_prerequisites').select('*'),
    supabase.from('user_skills').select('skill_id').eq('user_id', user.id),
    supabase.from('muscle_group_xp').select('*').eq('user_id', user.id),
  ])

  const mgXp = Object.fromEntries(
    (mgXpRows ?? []).map(r => [r.muscle_group, r.xp])
  ) as Record<MuscleGroup, number>

  const unlockedSkillIds = computeUnlockedSkillIds(
    (skills ?? []) as Skill[],
    (prerequisites ?? []) as SkillPrerequisite[],
    new Set((userSkills ?? []).map(r => r.skill_id)),
    mgXp
  )

  const unlockedExercises = ((exercises ?? []) as Exercise[]).filter(
    e => e.skill_id === null || unlockedSkillIds.has(e.skill_id)
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Log Workout</h1>
        <p className="text-gray-400 text-sm mt-1">
          Build your workout from any exercises you have unlocked, log your sets, earn XP.
        </p>
      </div>
      <WorkoutBuilder exercises={unlockedExercises} />
    </div>
  )
}
