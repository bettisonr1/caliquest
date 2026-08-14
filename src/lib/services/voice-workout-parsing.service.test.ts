import { describe, expect, it, vi } from 'vitest'

const transcriptionsCreate = vi.fn()
const messagesParse = vi.fn()

vi.mock('openai', () => ({
  default: vi.fn(function OpenAI() {
    return { audio: { transcriptions: { create: transcriptionsCreate } } }
  }),
  toFile: vi.fn().mockResolvedValue('fake-file'),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function Anthropic() {
    return { messages: { parse: messagesParse } }
  }),
}))

vi.mock('@anthropic-ai/sdk/helpers/zod', () => ({
  zodOutputFormat: vi.fn(() => ({})),
}))

import { parseWorkoutText, transcribeAudio } from './voice-workout-parsing.service'

function audioBlob(type = 'audio/webm') {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type })
}

describe('transcribeAudio', () => {
  it('returns the trimmed transcript when it contains a set/rep quantity', async () => {
    transcriptionsCreate.mockResolvedValue({ text: '  three sets of ten push-ups  ' })

    const transcript = await transcribeAudio(audioBlob(), { userId: 'u1' })

    expect(transcript).toBe('three sets of ten push-ups')
  })

  it('throws EMPTY_TRANSCRIPT when Whisper returns nothing', async () => {
    transcriptionsCreate.mockResolvedValue({ text: '   ' })

    await expect(transcribeAudio(audioBlob(), { userId: 'u1' })).rejects.toThrow('EMPTY_TRANSCRIPT')
  })

  it('throws NO_QUANTITY_DETECTED when the transcript has no number', async () => {
    transcriptionsCreate.mockResolvedValue({ text: 'push-ups' })

    await expect(transcribeAudio(audioBlob(), { userId: 'u1' })).rejects.toThrow('NO_QUANTITY_DETECTED')
  })

  it('propagates a failed Whisper request', async () => {
    const error = new Error('rate limited')
    transcriptionsCreate.mockRejectedValue(error)

    await expect(transcribeAudio(audioBlob(), { userId: 'u1' })).rejects.toBe(error)
  })
})

describe('parseWorkoutText', () => {
  const exercises = [{ id: 'e1', name: 'Push-up' } as never]

  it('throws NO_UNLOCKED_EXERCISES when the user has nothing unlocked', async () => {
    await expect(parseWorkoutText('three sets of ten push-ups', [], { userId: 'u1' })).rejects.toThrow(
      'NO_UNLOCKED_EXERCISES'
    )
  })

  it('returns the parsed output from Claude', async () => {
    const parsed = { entries: [{ exerciseName: 'Push-up', sets: [{ value: 10 }] }], unmatched: [] }
    messagesParse.mockResolvedValue({ parsed_output: parsed })

    const result = await parseWorkoutText('three sets of ten push-ups', exercises, { userId: 'u1' })

    expect(result).toEqual(parsed)
  })

  it('throws PARSE_FAILED when Claude returns no parsed output', async () => {
    messagesParse.mockResolvedValue({ parsed_output: undefined })

    await expect(parseWorkoutText('mumble mumble', exercises, { userId: 'u1' })).rejects.toThrow('PARSE_FAILED')
  })

  it('propagates a failed Anthropic request', async () => {
    const error = new Error('service unavailable')
    messagesParse.mockRejectedValue(error)

    await expect(parseWorkoutText('three sets of ten push-ups', exercises, { userId: 'u1' })).rejects.toBe(error)
  })
})
