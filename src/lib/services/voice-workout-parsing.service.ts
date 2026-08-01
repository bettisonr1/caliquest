import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import OpenAI, { toFile } from 'openai'
import type { Logger } from 'pino'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { Exercise } from '@/types/database'

export type ParsedWorkoutEntry = { exerciseName: string; sets: { value: number }[] }
export type ParsedWorkout = { entries: ParsedWorkoutEntry[]; unmatched: string[] }

// Whisper identifies the container from the filename extension, not the
// blob's Content-Type — so the extension has to match what MediaRecorder
// actually produced. Browsers disagree on the default: Chrome/Firefox use
// webm, Safari/iOS commonly use mp4/aac. Hardcoding ".webm" works by
// accident on some browsers and fails with a 400 "Invalid file format" on
// others, so this must be derived from the real blob type.
const WHISPER_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg':  'ogg',
  'audio/wav':  'wav',
  'audio/wave': 'wav',
  'audio/mp4':  'mp4',
  'audio/aac':  'm4a',
  'audio/mpeg': 'mp3',
  'audio/flac': 'flac',
}

function filenameForAudioBlob(blob: Blob, log: Logger): string {
  const baseType = blob.type.split(';')[0].trim().toLowerCase()
  const extension = WHISPER_EXTENSION_BY_MIME_TYPE[baseType]
  if (!extension) {
    log.warn({ audioType: blob.type }, 'Unrecognized recording MIME type, defaulting to webm extension')
  }
  return `recording.${extension ?? 'webm'}`
}

// Whisper's `prompt` isn't an instruction — it's conditioning text the
// model treats as "what came just before," which biases it toward
// recognizing the vocabulary it contains. Seeding it with the user's own
// unlocked exercise names makes it much more likely to hear "Archer
// Pull-up" as that instead of the nearest everyday-English guess.
// Capped well under Whisper's ~224 token prompt limit.
//
// This must read as prose, not a bare list: a comma-separated enumeration
// is structurally identical to plausible output, and on weak/unclear audio
// the model can fall back to echoing the prompt itself as the "transcript"
// instead of admitting it didn't catch anything.
const WHISPER_PROMPT_MAX_CHARS = 800

function buildVocabularyPrompt(exerciseNames: string[]): string | undefined {
  if (exerciseNames.length === 0) return undefined

  const preamble =
    'Transcript of someone logging a calisthenics workout out loud, naming an exercise ' +
    'and how many sets and reps or seconds, for example "three sets of ten Push-ups". ' +
    'Exercises they might say include '
  const suffix = ', spoken naturally as part of a sentence.'

  let list = exerciseNames.join(', ')
  const budget = WHISPER_PROMPT_MAX_CHARS - preamble.length - suffix.length
  if (list.length > budget) {
    list = list.slice(0, budget)
    list = list.slice(0, Math.max(0, list.lastIndexOf(',')))
  }
  return `${preamble}${list}${suffix}`
}

// A real workout utterance always names a quantity ("3 sets of 10"). A
// transcript with no digit or number word anywhere is a strong, cheap
// signal that transcription failed — most often the model echoing the
// vocabulary prompt back verbatim on weak/unclear audio rather than
// actually transcribing speech.
const NUMBER_PATTERN =
  /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/i

function containsQuantity(text: string): boolean {
  return NUMBER_PATTERN.test(text)
}

const TRANSCRIPTION_MODEL = 'gpt-4o-transcribe'

export async function transcribeAudio(
  audioBlob: Blob,
  context: { userId: string; durationMs?: number | null; exerciseNames?: string[] }
): Promise<string> {
  const log = logger.child({
    userId: context.userId,
    feature: 'voice-transcribe',
    model: TRANSCRIPTION_MODEL,
    audioType: audioBlob.type,
    audioSize: audioBlob.size,
    durationMs: context.durationMs ?? null,
  })
  const openai = new OpenAI()
  const prompt = buildVocabularyPrompt(context.exerciseNames ?? [])
  log.info({ hasPrompt: prompt !== undefined, promptLength: prompt?.length ?? 0 }, 'Built Whisper vocabulary prompt')

  // Read the bytes once, up front: (1) lets us log the container's magic
  // number to confirm what actually arrived server-side is a real, intact
  // webm file and not something mangled in transit, and (2) uploading a
  // plain Buffer instead of the re-hydrated FormData Blob sidesteps any
  // ambiguity in how that Blob's .stream()/.arrayBuffer() behaves.
  const buffer = Buffer.from(await audioBlob.arrayBuffer())
  const magicBytes = buffer.subarray(0, 4).toString('hex')
  const looksLikeWebm = magicBytes === '1a45dfa3'
  log.info({ magicBytes, looksLikeWebm }, 'Read audio buffer for transcription')

  let transcription
  try {
    transcription = await openai.audio.transcriptions.create({
      file: await toFile(buffer, filenameForAudioBlob(audioBlob, log), { type: audioBlob.type }),
      model: TRANSCRIPTION_MODEL,
      language: 'en',
      temperature: 0,
      ...(prompt ? { prompt } : {}),
    })
  } catch (err) {
    log.error({ err }, 'Whisper transcription request failed')
    throw err
  }

  const transcript = transcription.text?.trim()
  if (!transcript) {
    log.warn('Whisper returned an empty transcript')
    throw new Error('EMPTY_TRANSCRIPT')
  }
  if (!containsQuantity(transcript)) {
    log.warn({ transcript }, 'Transcript has no set/rep quantity — likely a failed transcription')
    throw new Error('NO_QUANTITY_DETECTED')
  }

  log.info({ transcriptLength: transcript.length }, 'Whisper transcription succeeded')
  return transcript
}

export async function parseWorkoutText(
  transcript: string,
  unlockedExercises: Exercise[],
  context: { userId: string }
): Promise<ParsedWorkout> {
  const log = logger.child({ userId: context.userId, feature: 'voice-parse' })

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

  let response
  try {
    response = await anthropic.messages.parse({
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
  } catch (err) {
    log.error({ err, transcriptLength: transcript.length }, 'Anthropic workout parse request failed')
    throw err
  }

  if (!response.parsed_output) {
    log.warn({ transcriptLength: transcript.length }, 'Anthropic returned no parsed output for transcript')
    throw new Error('PARSE_FAILED')
  }

  log.info(
    { entries: response.parsed_output.entries.length, unmatched: response.parsed_output.unmatched.length },
    'Voice workout parse succeeded'
  )
  return response.parsed_output
}
