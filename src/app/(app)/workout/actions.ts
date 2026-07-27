'use server'

import { createClient } from '@/lib/supabase/server'
import { logWorkout, type SetInput } from '@/lib/services/workout-logging.service'

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
