'use client'

import { useMemo, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Clock, Dumbbell, Plus, Repeat, Trash2, X, Zap } from 'lucide-react'
import { saveWorkoutAction } from '@/app/(app)/workout/actions'
import { VoiceLogButton } from './VoiceLogButton'
import { GymTagPicker } from '@/components/gyms/GymTagPicker'
import { xpForSet } from '@/lib/xp'
import type { Exercise, MuscleGroup } from '@/types/database'

const FlexAvatar = dynamic(
  () => import('./FlexAvatar').then(m => m.FlexAvatar),
  { ssr: false, loading: () => <div className="h-56" /> }
)

const muscleGroups: { group: MuscleGroup; label: string; text: string; chip: string }[] = [
  { group: 'pull',     label: 'Pull',     text: 'text-blue-400',    chip: 'bg-blue-500/20 text-blue-400'       },
  { group: 'push',     label: 'Push',     text: 'text-orange-400',  chip: 'bg-orange-500/20 text-orange-400'   },
  { group: 'core',     label: 'Core',     text: 'text-yellow-400',  chip: 'bg-yellow-500/20 text-yellow-400'   },
  { group: 'legs',     label: 'Legs',     text: 'text-emerald-400', chip: 'bg-emerald-500/20 text-emerald-400' },
  { group: 'mobility', label: 'Mobility', text: 'text-purple-400',  chip: 'bg-purple-500/20 text-purple-400'   },
]

const chipClass = Object.fromEntries(muscleGroups.map(m => [m.group, m.chip])) as Record<MuscleGroup, string>

type EntrySet = { value: string }
type Entry = { key: number; exercise: Exercise; sets: EntrySet[] }

function setXp(exercise: Exercise, value: string): number {
  const n = parseInt(value, 10)
  if (isNaN(n) || n <= 0) return 0
  return exercise.type === 'reps' ? xpForSet(exercise, n, null) : xpForSet(exercise, null, n)
}

export function WorkoutBuilder({ exercises }: { exercises: Exercise[] }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [nextKey, setNextKey] = useState(0)
  const [filter, setFilter] = useState<MuscleGroup | 'all'>('all')
  const [notes, setNotes] = useState('')
  const [unmatched, setUnmatched] = useState<string[]>([])
  const [gymId, setGymId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{
    xpEarned: number
    newLevel: number
    leveledUp: boolean
    questBonusXp: number
    completedQuestTitles: string[]
    workedGroups: MuscleGroup[]
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const visibleExercises = useMemo(
    () => exercises.filter(e => filter === 'all' || e.muscle_group === filter),
    [exercises, filter]
  )

  const totalXp = entries.reduce(
    (sum, entry) => sum + entry.sets.reduce((s, set) => s + setXp(entry.exercise, set.value), 0),
    0
  )
  const totalSets = entries.reduce(
    (sum, entry) => sum + entry.sets.filter(s => setXp(entry.exercise, s.value) > 0).length,
    0
  )

  const addExercise = (exercise: Exercise) => {
    setEntries(prev => [...prev, { key: nextKey, exercise, sets: [{ value: '' }] }])
    setNextKey(k => k + 1)
  }

  const addParsedEntries = (
    parsed: { exerciseId: string; sets: { value: string }[] }[],
    unmatchedPhrases: string[]
  ) => {
    const matched = parsed
      .map(p => ({ exercise: exercises.find(e => e.id === p.exerciseId), sets: p.sets }))
      .filter((p): p is { exercise: Exercise; sets: EntrySet[] } => p.exercise !== undefined)
    setEntries(prev => [
      ...prev,
      ...matched.map((p, i) => ({
        key: nextKey + i,
        exercise: p.exercise,
        sets: p.sets.length > 0 ? p.sets : [{ value: '' }],
      })),
    ])
    setNextKey(k => k + matched.length)
    setUnmatched(unmatchedPhrases)
  }

  const removeEntry = (key: number) =>
    setEntries(prev => prev.filter(e => e.key !== key))

  const addSet = (key: number) =>
    setEntries(prev => prev.map(e =>
      e.key === key
        ? { ...e, sets: [...e.sets, { value: e.sets[e.sets.length - 1]?.value ?? '' }] }
        : e
    ))

  const removeSet = (key: number, index: number) =>
    setEntries(prev => prev.map(e =>
      e.key === key ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e
    ))

  const updateSet = (key: number, index: number, value: string) =>
    setEntries(prev => prev.map(e =>
      e.key === key
        ? { ...e, sets: e.sets.map((s, i) => (i === index ? { value } : s)) }
        : e
    ))

  const finish = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveWorkoutAction(
        entries.map(entry => ({
          exerciseId: entry.exercise.id,
          sets: entry.sets.map(s => {
            const n = parseInt(s.value, 10)
            const v = isNaN(n) ? 0 : n
            return entry.exercise.type === 'reps'
              ? { reps: v, duration_seconds: null }
              : { reps: null, duration_seconds: v }
          }),
        })),
        notes,
        gymId
      )
      if (result.ok === false) {
        setError(result.error)
      } else {
        const workedSet = new Set(
          entries
            .filter(entry => entry.sets.some(s => setXp(entry.exercise, s.value) > 0))
            .map(entry => entry.exercise.muscle_group)
        )
        setSaved({
          xpEarned: result.xpEarned,
          newLevel: result.newLevel,
          leveledUp: result.leveledUp,
          questBonusXp: result.questBonusXp,
          completedQuestTitles: result.completedQuestTitles,
          workedGroups: muscleGroups.map(m => m.group).filter(g => workedSet.has(g)),
        })
        setEntries([])
        setNotes('')
        setGymId(null)
      }
    })
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-emerald-500/40 bg-gray-900 p-8 text-center">
        <FlexAvatar workedGroups={saved.workedGroups} />
        <h2 className="text-xl font-bold text-white">Workout complete!</h2>
        {saved.workedGroups.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {muscleGroups
              .filter(m => saved.workedGroups.includes(m.group))
              .map(m => (
                <span key={m.group} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.chip}`}>
                  {m.label}
                </span>
              ))}
          </div>
        )}
        <p className="mt-2 text-3xl font-bold text-emerald-400">+{saved.xpEarned.toLocaleString()} XP</p>
        {saved.completedQuestTitles.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-purple-300">
            Quest complete: {saved.completedQuestTitles.join(', ')}! +{saved.questBonusXp.toLocaleString()} bonus XP
          </p>
        )}
        {saved.leveledUp && (
          <p className="mt-2 text-sm font-semibold text-yellow-400">
            Level up! You reached level {saved.newLevel}.
          </p>
        )}
        <button
          onClick={() => setSaved(null)}
          className="mt-6 px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          Log another workout
        </button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      {/* Exercise picker */}
      <aside className="rounded-2xl border border-gray-800 bg-gray-900 p-4 lg:sticky lg:top-20">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Add exercise</h2>
        <VoiceLogButton onParsed={addParsedEntries} />
        {unmatched.length > 0 && (
          <div className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
            <span>Couldn&apos;t match: {unmatched.join(', ')} — add these manually.</span>
            <button
              onClick={() => setUnmatched([])}
              className="shrink-0 text-yellow-300/70 hover:text-yellow-300"
              aria-label="Dismiss unmatched exercises note"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {muscleGroups.map(({ group, label, chip }) => (
            <button
              key={group}
              onClick={() => setFilter(group)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === group ? chip : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="space-y-1 max-h-96 overflow-y-auto pr-1">
          {visibleExercises.map(exercise => (
            <li key={exercise.id}>
              <button
                onClick={() => addExercise(exercise)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {exercise.type === 'duration'
                    ? <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    : <Repeat className="h-3.5 w-3.5 text-gray-500 shrink-0" />}
                  <span className="truncate">{exercise.name}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${chipClass[exercise.muscle_group]}`}>
                    ×{exercise.difficulty_multiplier}
                  </span>
                  <Plus className="h-3.5 w-3.5 text-gray-600 group-hover:text-emerald-400" />
                </span>
              </button>
            </li>
          ))}
          {visibleExercises.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No unlocked exercises in this group yet.</li>
          )}
        </ul>
      </aside>

      {/* Current workout */}
      <section>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
            <Dumbbell className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Your workout is empty</p>
            <p className="text-sm text-gray-500 mt-1">Pick exercises from the list to start building it.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => {
              const entryXp = entry.sets.reduce((s, set) => s + setXp(entry.exercise, set.value), 0)
              return (
                <div key={entry.key} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${chipClass[entry.exercise.muscle_group]}`}>
                        ×{entry.exercise.difficulty_multiplier}
                      </span>
                      <h3 className="font-semibold text-white truncate">{entry.exercise.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-sm text-emerald-400 font-medium">
                        <Zap className="h-3.5 w-3.5" />{entryXp}
                      </span>
                      <button
                        onClick={() => removeEntry(entry.key)}
                        className="p-2.5 -m-2.5 text-gray-600 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${entry.exercise.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {entry.sets.map((set, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-12 text-xs text-gray-500 font-medium shrink-0">Set {i + 1}</span>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={set.value}
                          onChange={e => updateSet(entry.key, i, e.target.value)}
                          placeholder="0"
                          className="w-24 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs text-gray-500">
                          {entry.exercise.type === 'reps' ? 'reps' : 'seconds'}
                        </span>
                        <span className="ml-auto text-xs text-gray-500">
                          +{setXp(entry.exercise, set.value)} XP
                        </span>
                        <button
                          onClick={() => removeSet(entry.key, i)}
                          disabled={entry.sets.length === 1}
                          className="p-2.5 -m-2.5 text-gray-600 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
                          aria-label={`Remove set ${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addSet(entry.key)}
                    className="mt-3 flex items-center gap-1 py-2 -my-2 pr-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add set
                  </button>
                </div>
              )
            })}

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <GymTagPicker onSelect={setGymId} />

              <label htmlFor="workout-notes" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mt-3 mb-2">
                Notes
              </label>
              <textarea
                id="workout-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="How did it feel?"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
              />

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-400">
                  <span className="text-white font-semibold">{totalSets}</span> sets ·{' '}
                  <span className="text-emerald-400 font-semibold">+{totalXp.toLocaleString()} XP</span>
                </div>
                <button
                  onClick={finish}
                  disabled={isPending || totalSets === 0}
                  className="px-5 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
                >
                  {isPending ? 'Saving…' : 'Finish workout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
