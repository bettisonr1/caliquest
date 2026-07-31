import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import OpenAI, { toFile } from 'openai'
import { z } from 'zod'
import type { Exercise } from '@/types/database'

export type ParsedWorkoutEntry = { exerciseName: string; sets: { value: number }[] }
export type ParsedWorkout = { entries: ParsedWorkoutEntry[]; unmatched: string[] }

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const openai = new OpenAI()

  const transcription = await openai.audio.transcriptions.create({
    file: await toFile(audioBlob, 'recording.webm'),
    model: 'whisper-1',
  })

  const transcript = transcription.text?.trim()
  if (!transcript) throw new Error('EMPTY_TRANSCRIPT')

  return transcript
}

export async function parseWorkoutText(
  transcript: string,
  unlockedExercises: Exercise[]
): Promise<ParsedWorkout> {
  if (unlockedExercises.length === 0) throw new Error('NO_UNLOCKED_EXERCISES')

  const exerciseNames = unlockedExercises.map(e => e.name) as [string, ...string[]]

  const schema = z.object({
    entries: z.array(
      z.object({
        exerciseName: z.enum(exerciseNames),
        sets: z.array(z.object({ value: z.number().positive() })).min(1),
      })
    ),
    unmatched: z.array(z.string()).default([]),
  })

  const anthropic = new Anthropic()

  const response = await anthropic.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system:
      'Extract the exercises and sets described in the workout, matching each exercise ' +
      'to one of the provided exercise names exactly. Each set has a single numeric value: ' +
      'reps for rep-based exercises, seconds for duration-based ones ("3 sets of 10" means ' +
      'three sets of value 10). If a phrase describes an exercise that does not clearly ' +
      'match one of the given exercise names, put the raw phrase in `unmatched` instead of guessing.',
    messages: [{ role: 'user', content: transcript }],
    output_config: {
      format: zodOutputFormat(schema),
    },
  })

  if (!response.parsed_output) throw new Error('PARSE_FAILED')

  return response.parsed_output
}
