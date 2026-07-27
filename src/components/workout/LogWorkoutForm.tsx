'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logWorkoutAction } from '@/app/(app)/workout/actions'
import type { Exercise, Skill } from '@/types/database'

type Props = {
  skills: Skill[]
  exercisesBySkillId: Record<string, Exercise[]>
}

const inputClass =
  'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500'

export function LogWorkoutForm({ skills, exercisesBySkillId }: Props) {
  const router = useRouter()

  const [skillId, setSkillId] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [numSets, setNumSets] = useState(3)
  const [defaultValue, setDefaultValue] = useState(10)
  const [setValues, setSetValues] = useState<number[]>([10, 10, 10])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const exercises = skillId ? (exercisesBySkillId[skillId] ?? []) : []
  const exercise = exercises.find(e => e.id === exerciseId) ?? null
  const unit = exercise?.type === 'duration' ? 'Duration (sec)' : 'Reps'

  function handleSkillChange(newSkillId: string) {
    setSkillId(newSkillId)
    setSuccess(false)
    setError(null)
    const skillExercises = exercisesBySkillId[newSkillId] ?? []
    setExerciseId(skillExercises.length === 1 ? skillExercises[0].id : '')
  }

  function resizeSets(count: number, value: number) {
    setNumSets(count)
    setSetValues(prev => {
      const next = [...prev]
      next.length = count
      for (let i = 0; i < count; i++) {
        if (next[i] === undefined) next[i] = value
      }
      return next
    })
  }

  function handleDefaultValueChange(value: number) {
    setDefaultValue(value)
    setSetValues(prev => prev.map(() => value))
  }

  function handleSetValueChange(index: number, value: number) {
    setSetValues(prev => prev.map((v, i) => (i === index ? value : v)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!exercise) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await logWorkoutAction({
      skillId,
      exerciseId: exercise.id,
      sets: setValues.map(v =>
        exercise.type === 'reps' ? { reps: v, duration_seconds: null } : { reps: null, duration_seconds: v }
      ),
    })

    if (result.ok === false) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccess(true)
    router.refresh()
  }

  const canSubmit = skillId !== '' && exercise !== null && numSets > 0

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-4"
    >
      <div>
        <label className="block text-sm text-gray-400 mb-1">Skill</label>
        <select
          required
          value={skillId}
          onChange={e => handleSkillChange(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>Select a skill…</option>
          {skills.map(skill => (
            <option key={skill.id} value={skill.id}>{skill.name}</option>
          ))}
        </select>
      </div>

      {skillId && exercises.length > 1 && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exercise</label>
          <select
            required
            value={exerciseId}
            onChange={e => setExerciseId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Select an exercise…</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
      )}

      {skillId && exercises.length === 1 && (
        <p className="text-sm text-gray-400">
          Exercise: <span className="text-white font-medium">{exercises[0].name}</span>
        </p>
      )}

      {skillId && exercises.length === 0 && (
        <p className="text-sm text-red-400">No exercises are configured for this skill yet.</p>
      )}

      {exercise && (
        <>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of sets</label>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={numSets}
              onChange={e => resizeSets(Math.max(1, Number(e.target.value)), defaultValue)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Default {unit.toLowerCase()}</label>
            <input
              type="number"
              min={1}
              required
              value={defaultValue}
              onChange={e => handleDefaultValueChange(Math.max(1, Number(e.target.value)))}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Per-set {unit.toLowerCase()} (adjust if you fatigued out)</p>
            <div className="grid grid-cols-3 gap-2">
              {setValues.map((value, i) => (
                <div key={i}>
                  <label className="block text-[11px] text-gray-500 mb-1">Set {i + 1}</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={value}
                    onChange={e => handleSetValueChange(i, Math.max(1, Number(e.target.value)))}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-emerald-400 text-sm">Workout logged!</p>}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
      >
        {loading ? 'Logging…' : 'Log Workout'}
      </button>
    </form>
  )
}
