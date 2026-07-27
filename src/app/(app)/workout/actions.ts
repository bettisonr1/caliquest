'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeUnlockedSkillIds } from '@/lib/skills'
import { nextStreak, xpForSet, xpToLevel } from '@/lib/xp'
import type { Exercise, MuscleGroup, Skill, SkillPrerequisite } from '@/types/database'

export type SetInput = {
  reps:            number | null
  durationSeconds: number | null
}

export type WorkoutEntryInput = {
  exerciseId: string
  sets:       SetInput[]
}

export type SaveWorkoutResult =
  | { ok: true; xpEarned: number; newLevel: number; leveledUp: boolean }
  | { ok: false; error: string }

const MAX_REPS = 1000
const MAX_DURATION_SECONDS = 3600

export async function saveWorkout(
  entries: WorkoutEntryInput[],
  notes: string | null
): Promise<SaveWorkoutResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  if (!entries.length || entries.every(e => e.sets.length === 0)) {
    return { ok: false, error: 'Add at least one set before finishing.' }
  }

  const [
    { data: exercises },
    { data: skills },
    { data: prerequisites },
    { data: userSkills },
    { data: mgXpRows },
    { data: profile },
  ] = await Promise.all([
    supabase.from('exercises').select('*'),
    supabase.from('skills').select('*'),
    supabase.from('skill_prerequisites').select('*'),
    supabase.from('user_skills').select('skill_id').eq('user_id', user.id),
    supabase.from('muscle_group_xp').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
  ])
  if (!profile) return { ok: false, error: 'Profile not found.' }

  const mgXp = Object.fromEntries(
    (mgXpRows ?? []).map(r => [r.muscle_group, r.xp])
  ) as Record<MuscleGroup, number>

  const unlockedSkillIds = computeUnlockedSkillIds(
    (skills ?? []) as Skill[],
    (prerequisites ?? []) as SkillPrerequisite[],
    new Set((userSkills ?? []).map(r => r.skill_id)),
    mgXp
  )
  const exerciseById = new Map(((exercises ?? []) as Exercise[]).map(e => [e.id, e]))

  // Validate entries and compute XP server-side — never trust client totals.
  type ValidatedSet = {
    exercise_id:      string
    reps:             number | null
    duration_seconds: number | null
    xp_earned:        number
  }
  const validatedSets: ValidatedSet[] = []
  const mgXpGained: Partial<Record<MuscleGroup, number>> = {}

  for (const entry of entries) {
    const exercise = exerciseById.get(entry.exerciseId)
    if (!exercise) return { ok: false, error: 'Unknown exercise in workout.' }
    if (exercise.skill_id !== null && !unlockedSkillIds.has(exercise.skill_id)) {
      return { ok: false, error: `${exercise.name} is not unlocked yet.` }
    }

    for (const set of entry.sets) {
      const reps = exercise.type === 'reps'
        ? Math.min(MAX_REPS, Math.floor(set.reps ?? 0))
        : null
      const durationSeconds = exercise.type === 'duration'
        ? Math.min(MAX_DURATION_SECONDS, Math.floor(set.durationSeconds ?? 0))
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

  if (!validatedSets.length) {
    return { ok: false, error: 'Add at least one set with reps or time before finishing.' }
  }

  const totalXp = validatedSets.reduce((sum, s) => sum + s.xp_earned, 0)
  const now = new Date().toISOString()

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      started_at: now,
      completed_at: now,
      total_xp: totalXp,
      notes: notes?.trim() || null,
    })
    .select('id')
    .single()
  if (workoutError || !workout) {
    return { ok: false, error: 'Could not save workout. Please try again.' }
  }

  const { error: setsError } = await supabase
    .from('workout_sets')
    .insert(validatedSets.map(s => ({ ...s, workout_id: workout.id })))
  if (setsError) {
    return { ok: false, error: 'Could not save workout sets. Please try again.' }
  }

  for (const [group, gained] of Object.entries(mgXpGained)) {
    await supabase
      .from('muscle_group_xp')
      .update({ xp: (mgXp[group as MuscleGroup] ?? 0) + gained })
      .eq('user_id', user.id)
      .eq('muscle_group', group)
  }

  const newTotalXp = profile.total_xp + totalXp
  const newLevel = xpToLevel(newTotalXp)
  await supabase
    .from('profiles')
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      streak_days: nextStreak(profile.last_workout_at, profile.streak_days),
      last_workout_at: now,
    })
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath('/skills')
  revalidatePath('/workout')

  return {
    ok: true,
    xpEarned: totalXp,
    newLevel,
    leveledUp: newLevel > profile.level,
  }
}
