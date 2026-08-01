'use server'

import { createClient } from '@/lib/supabase/server'
import { getWorkoutLoggingOptions } from '@/lib/services/workout-logging.service'
import { parseWorkoutText, transcribeAudio } from '@/lib/services/voice-workout-parsing.service'

export async function transcribeAudioAction(
  formData: FormData
): Promise<{ ok: true; transcript: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const audio = formData.get('audio')
  if (!(audio instanceof Blob) || audio.size === 0) {
    return { ok: false, error: 'No audio was recorded. Please try again.' }
  }

  try {
    const transcript = await transcribeAudio(audio)
    return { ok: true, transcript }
  } catch {
    return { ok: false, error: 'Could not transcribe the recording. Please try again.' }
  }
}

export async function parseWorkoutFromVoiceAction(transcript: string): Promise<
  | { ok: true; entries: Array<{ exerciseId: string; sets: { value: string }[] }>; unmatched: string[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const { exercisesBySkillId } = await getWorkoutLoggingOptions(user.id)
    const unlockedExercises = Object.values(exercisesBySkillId).flat()

    const parsed = await parseWorkoutText(transcript, unlockedExercises)

    const exerciseByName = new Map(unlockedExercises.map(e => [e.name, e]))
    const entries: Array<{ exerciseId: string; sets: { value: string }[] }> = []
    for (const entry of parsed.entries) {
      const exercise = exerciseByName.get(entry.exerciseName)
      if (!exercise) continue
      entries.push({
        exerciseId: exercise.id,
        sets: entry.sets.map(s => ({ value: String(s.value) })),
      })
    }

    return { ok: true, entries, unmatched: parsed.unmatched }
  } catch (e) {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    if (code === 'NO_UNLOCKED_EXERCISES') {
      return { ok: false, error: 'Unlock a skill first, then try voice logging.' }
    }
    return { ok: false, error: 'Could not understand the workout. Please try again.' }
  }
}
