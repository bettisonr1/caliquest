'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  logWorkout,
  saveWorkout,
  type SetInput,
  type WorkoutEntryInput,
} from '@/lib/services/workout-logging.service'

export async function logWorkoutAction(input: {
  skillId: string
  exerciseId: string
  sets: SetInput[]
}): Promise<{ ok: true; workoutId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'NOT_AUTHENTICATED' }

  try {
    const { workoutId } = await logWorkout(user.id, input.skillId, input.exerciseId, input.sets)
    return { ok: true, workoutId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'UNKNOWN_ERROR' }
  }
}

export type SaveWorkoutResult =
  | {
      ok: true
      xpEarned: number
      newLevel: number
      leveledUp: boolean
      questBonusXp: number
      completedQuestTitles: string[]
    }
  | { ok: false; error: string }

const saveWorkoutErrorMessages: Record<string, string> = {
  EMPTY_WORKOUT:      'Add at least one set before finishing.',
  INVALID_SET_VALUE:  'Add at least one set with reps or time before finishing.',
  EXERCISE_NOT_FOUND: 'Unknown exercise in workout.',
  SKILL_NOT_UNLOCKED: 'One of these exercises is not unlocked yet.',
}

export async function saveWorkoutAction(
  entries: WorkoutEntryInput[],
  notes: string | null,
  gymId: string | null = null
): Promise<SaveWorkoutResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const outcome = await saveWorkout(user.id, entries, notes, gymId)

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    revalidatePath('/skills')
    revalidatePath('/workout')
    revalidatePath('/quests')
    if (gymId) revalidatePath(`/gyms/${gymId}`)

    return { ok: true, ...outcome }
  } catch (e) {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    return {
      ok: false,
      error: saveWorkoutErrorMessages[code] ?? 'Could not save workout. Please try again.',
    }
  }
}
