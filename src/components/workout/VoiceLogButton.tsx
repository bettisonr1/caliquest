'use client'

import { useRef, useState } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'
import { parseWorkoutFromVoiceAction, transcribeAudioAction } from '@/app/(app)/workout/voice-actions'

type Status = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'error'

const statusLabels: Record<Status, string> = {
  idle: 'Log by voice',
  recording: 'Stop recording',
  transcribing: 'Transcribing…',
  parsing: 'Reading your workout…',
  error: 'Try again',
}

export function VoiceLogButton({
  onParsed,
}: {
  onParsed: (entries: { exerciseId: string; sets: { value: string }[] }[], unmatched: string[]) => void
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        void processRecording(new Blob(chunksRef.current, { type: recorder.mimeType }))
      }

      recorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch {
      setError('Could not access the microphone. Check your browser permissions.')
      setStatus('error')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
  }

  const processRecording = async (audioBlob: Blob) => {
    setStatus('transcribing')
    const formData = new FormData()
    formData.append('audio', audioBlob)

    const transcribed = await transcribeAudioAction(formData)
    if (transcribed.ok === false) {
      setError(transcribed.error)
      setStatus('error')
      return
    }

    setStatus('parsing')
    const parsed = await parseWorkoutFromVoiceAction(transcribed.transcript)
    if (parsed.ok === false) {
      setError(parsed.error)
      setStatus('error')
      return
    }

    onParsed(parsed.entries, parsed.unmatched)
    setStatus('idle')
  }

  const busy = status === 'transcribing' || status === 'parsing'

  return (
    <div className="mb-3">
      <button
        onClick={status === 'recording' ? stopRecording : startRecording}
        disabled={busy}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
          status === 'recording'
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50'
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'recording' ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {statusLabels[status]}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
