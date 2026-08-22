'use server'

import { getAuthenticatedUser } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getWorkoutLoggingOptions } from '@/lib/services/workout-logging.service'
import { parseWorkoutText, transcribeAudio } from '@/lib/services/voice-workout-parsing.service'

// Below this, a recording is essentially empty/silent — container overhead
// only, no real speech. OpenAI rejects these with a misleading "Invalid
// file format" error even though the container itself is fine, so this is
// caught here with an accurate message instead.
const MIN_AUDIO_BYTES = 2000

export async function transcribeAudioAction(
  formData: FormData
): Promise<{ ok: true; transcript: string } | { ok: false; error: string }> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const audio = formData.get('audio')
  const durationMsRaw = formData.get('durationMs')
  const durationMs = typeof durationMsRaw === 'string' && durationMsRaw !== '' ? Number(durationMsRaw) : null

  if (!(audio instanceof Blob) || audio.size === 0) {
    return { ok: false, error: 'No audio was recorded. Please try again.' }
  }
  if (audio.size < MIN_AUDIO_BYTES) {
    logger.warn(
      { userId: user.id, feature: 'voice-transcribe', audioSize: audio.size, durationMs },
      'Recording too short to transcribe'
    )
    return { ok: false, error: 'Recording was too short — hold the button longer and speak clearly.' }
  }

  try {
    const { exercisesBySkillId } = await getWorkoutLoggingOptions(user.id)
    const exerciseNames = Object.values(exercisesBySkillId).flat().map(e => e.name)

    const transcript = await transcribeAudio(audio, { userId: user.id, durationMs, exerciseNames })
    return { ok: true, transcript }
  } catch (e) {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    if (code === 'NO_QUANTITY_DETECTED') {
      return { ok: false, error: 'Didn’t catch any numbers — try saying something like "3 sets of 10 push-ups."' }
    }
    return { ok: false, error: 'Could not transcribe the recording. Please try again.' }
  }
}

export async function parseWorkoutFromVoiceAction(transcript: string): Promise<
  | { ok: true; entries: Array<{ exerciseId: string; sets: { value: string }[] }>; unmatched: string[] }
  | { ok: false; error: string }
> {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const { exercisesBySkillId } = await getWorkoutLoggingOptions(user.id)
    const unlockedExercises = Object.values(exercisesBySkillId).flat()

    const parsed = await parseWorkoutText(transcript, unlockedExercises, { userId: user.id })

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
