import { createClient } from '@/lib/supabase/server'
import { getAllSkills, getUserUnlockedSkillIds } from '@/lib/repositories/skills.repository'
import { getAllExercises, getExerciseById, getExercisesBySkillId } from '@/lib/repositories/exercises.repository'
import { createWorkout, createWorkoutSets } from '@/lib/repositories/workouts.repository'
import {
  getMuscleGroupXP,
  getProfile,
  updateMuscleGroupXP,
  updateProfileAfterWorkout,
} from '@/lib/repositories/profiles.repository'
import { applyWorkoutToQuests } from '@/lib/services/quests.service'
import { nextStreak, xpForSet, xpToLevel } from '@/lib/xp'
import type { Exercise, MuscleGroup, Skill } from '@/types/database'

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

// ------------------------------------------------------------------
// Multi-exercise workouts: any mix of unlocked exercises, XP awarded
// per set and rolled up into muscle-group XP, total XP, level, streak.
// ------------------------------------------------------------------

export type WorkoutEntryInput = {
  exerciseId: string
  sets: SetInput[]
}

export type SaveWorkoutOutcome = {
  xpEarned: number
  newLevel: number
  leveledUp: boolean
  questBonusXp: number
  completedQuestTitles: string[]
}

const MAX_REPS = 1000
const MAX_DURATION_SECONDS = 3600

export async function saveWorkout(
  userId: string,
  entries: WorkoutEntryInput[],
  notes: string | null
): Promise<SaveWorkoutOutcome> {
  const supabase = await createClient()

  if (entries.length === 0) throw new Error('EMPTY_WORKOUT')

  const [exercises, unlockedIds, mgXp, profile] = await Promise.all([
    getAllExercises(supabase),
    getUserUnlockedSkillIds(supabase, userId),
    getMuscleGroupXP(supabase, userId),
    getProfile(supabase, userId),
  ])
  const exerciseById = new Map(exercises.map(e => [e.id, e]))

  const validatedSets: Array<{
    exercise_id: string
    reps: number | null
    duration_seconds: number | null
    xp_earned: number
  }> = []
  const mgXpGained: Partial<Record<MuscleGroup, number>> = {}

  for (const entry of entries) {
    const exercise = exerciseById.get(entry.exerciseId)
    if (!exercise) throw new Error('EXERCISE_NOT_FOUND')
    if (exercise.skill_id !== null && !unlockedIds.has(exercise.skill_id)) {
      throw new Error('SKILL_NOT_UNLOCKED')
    }

    for (const set of entry.sets) {
      const reps = exercise.type === 'reps'
        ? Math.min(MAX_REPS, Math.floor(set.reps ?? 0))
        : null
      const durationSeconds = exercise.type === 'duration'
        ? Math.min(MAX_DURATION_SECONDS, Math.floor(set.duration_seconds ?? 0))
        : null
      if ((reps ?? 0) <= 0 && (durationSeconds ?? 0) <= 0) continue

      const xp = xpForSet(exercise, reps, durationSeconds)
      validatedSets.push({
        exercise_id: exercise.id,
        reps,
        duration_seconds: durationSeconds,
        xp_earned: xp,
      })
      mgXpGained[exercise.muscle_group] = (mgXpGained[exercise.muscle_group] ?? 0) + xp
    }
  }

  if (validatedSets.length === 0) throw new Error('INVALID_SET_VALUE')

  const totalXp = validatedSets.reduce((sum, s) => sum + s.xp_earned, 0)

  const workout = await createWorkout(supabase, userId, { totalXp, notes: notes?.trim() || null })
  await createWorkoutSets(
    supabase,
    validatedSets.map(s => ({ ...s, workout_id: workout.id }))
  )

  for (const [group, gained] of Object.entries(mgXpGained)) {
    await updateMuscleGroupXP(
      supabase,
      userId,
      group as MuscleGroup,
      (mgXp[group as MuscleGroup] ?? 0) + gained
    )
  }

  const newTotalXp = profile.total_xp + totalXp
  const newLevel = xpToLevel(newTotalXp)
  await updateProfileAfterWorkout(supabase, userId, {
    total_xp: newTotalXp,
    level: newLevel,
    streak_days: nextStreak(profile.last_workout_at, profile.streak_days),
    last_workout_at: workout.completed_at ?? workout.started_at,
  })

  const quests = await applyWorkoutToQuests(supabase, userId, mgXpGained)
  const finalLevel = xpToLevel(newTotalXp + quests.bonusXp)

  return {
    xpEarned: totalXp + quests.bonusXp,
    newLevel: finalLevel,
    leveledUp: finalLevel > profile.level,
    questBonusXp: quests.bonusXp,
    completedQuestTitles: quests.completedQuestTitles,
  }
}
