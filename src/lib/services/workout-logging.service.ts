import { createClient } from '@/lib/supabase/server'
import { getAllSkills, getUserUnlockedSkillIds } from '@/lib/repositories/skills.repository'
import { getExerciseById, getExercisesBySkillId } from '@/lib/repositories/exercises.repository'
import { createWorkout, createWorkoutSets } from '@/lib/repositories/workouts.repository'
import type { Exercise, Skill } from '@/types/database'

export type SetInput = { reps: number | null; duration_seconds: number | null }

export async function getWorkoutLoggingOptions(userId: string): Promise<{
  skills: Skill[]
  exercisesBySkillId: Record<string, Exercise[]>
}> {
  const supabase = await createClient()

  const [allSkills, unlockedIds] = await Promise.all([
    getAllSkills(supabase),
    getUserUnlockedSkillIds(supabase, userId),
  ])

  const skills = allSkills.filter(s => unlockedIds.has(s.id))

  const exercisesBySkillId: Record<string, Exercise[]> = {}
  await Promise.all(
    skills.map(async skill => {
      exercisesBySkillId[skill.id] = await getExercisesBySkillId(supabase, skill.id)
    })
  )

  return { skills, exercisesBySkillId }
}

function isValidSetValue(set: SetInput, exercise: Exercise): boolean {
  if (exercise.type === 'reps') {
    return Number.isInteger(set.reps) && (set.reps as number) > 0 && set.duration_seconds === null
  }
  return Number.isInteger(set.duration_seconds) && (set.duration_seconds as number) > 0 && set.reps === null
}

export async function logWorkout(
  userId: string,
  skillId: string,
  exerciseId: string,
  sets: SetInput[]
): Promise<{ workoutId: string }> {
  const supabase = await createClient()

  const unlockedIds = await getUserUnlockedSkillIds(supabase, userId)
  if (!unlockedIds.has(skillId)) throw new Error('SKILL_NOT_UNLOCKED')

  const exercise = await getExerciseById(supabase, exerciseId)
  if (!exercise || exercise.skill_id !== skillId) throw new Error('EXERCISE_SKILL_MISMATCH')

  if (sets.length === 0 || !sets.every(s => isValidSetValue(s, exercise))) {
    throw new Error('INVALID_SET_VALUE')
  }

  const workout = await createWorkout(supabase, userId)
  await createWorkoutSets(
    supabase,
    sets.map(s => ({
      workout_id: workout.id,
      exercise_id: exerciseId,
      reps: s.reps,
      duration_seconds: s.duration_seconds,
    }))
  )

  return { workoutId: workout.id }
}
