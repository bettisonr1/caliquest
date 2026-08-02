import { Clock, Repeat, Zap } from 'lucide-react'
import { FistBumpButton } from '@/components/workout/FistBumpButton'
import type { MuscleGroup, WorkoutWithBumps } from '@/types/database'

const chipClass: Record<MuscleGroup, string> = {
  pull:     'bg-blue-500/20 text-blue-400',
  push:     'bg-orange-500/20 text-orange-400',
  core:     'bg-yellow-500/20 text-yellow-400',
  legs:     'bg-emerald-500/20 text-emerald-400',
  mobility: 'bg-purple-500/20 text-purple-400',
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit',
})

type ExerciseGroup = {
  name:         string
  muscleGroup:  MuscleGroup
  type:         'reps' | 'duration'
  sets:         { reps: number | null; duration_seconds: number | null }[]
  xp:           number
}

function groupSetsByExercise(workout: WorkoutWithBumps): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>()
  for (const set of workout.workout_sets) {
    if (!set.exercises) continue
    let group = groups.get(set.exercise_id)
    if (!group) {
      group = {
        name:        set.exercises.name,
        muscleGroup: set.exercises.muscle_group,
        type:        set.exercises.type,
        sets:        [],
        xp:          0,
      }
      groups.set(set.exercise_id, group)
    }
    group.sets.push({ reps: set.reps, duration_seconds: set.duration_seconds })
    group.xp += set.xp_earned
  }
  return [...groups.values()]
}

function describeSets(group: ExerciseGroup): string {
  const values = group.sets.map(s =>
    group.type === 'reps' ? (s.reps ?? 0) : (s.duration_seconds ?? 0)
  )
  const unit = group.type === 'reps' ? 'reps' : 's'
  const allEqual = values.every(v => v === values[0])
  if (allEqual) return `${values.length} × ${values[0]}${unit === 's' ? 's' : ' reps'}`
  return values.map(v => `${v}${unit === 's' ? 's' : ''}`).join(', ') + (unit === 's' ? '' : ' reps')
}

function WorkoutCard({
  workout,
  viewerId,
  canBump,
}: {
  workout:  WorkoutWithBumps
  viewerId: string
  canBump:  boolean
}) {
  const exercises = groupSetsByExercise(workout)
  const when = new Date(workout.started_at)
  const bumps = workout.workout_fistbumps
  const viewerBumped = bumps.some(b => b.user_id === viewerId)

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="font-semibold text-white">{dateFormat.format(when)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {timeFormat.format(when)} · {exercises.length} exercise{exercises.length === 1 ? '' : 's'} · {workout.workout_sets.length} sets
          </p>
        </div>
        <span className="flex items-center gap-1 text-lg font-bold text-emerald-400 shrink-0">
          <Zap className="h-4 w-4" />+{workout.total_xp.toLocaleString()} XP
        </span>
      </div>

      <ul className="divide-y divide-gray-800">
        {exercises.map(group => (
          <li key={group.name} className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {group.type === 'duration'
                ? <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                : <Repeat className="h-3.5 w-3.5 text-gray-500 shrink-0" />}
              <span className="text-sm text-white font-medium truncate">{group.name}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${chipClass[group.muscleGroup]}`}>
                {group.muscleGroup}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-sm">
              <span className="text-gray-400">{describeSets(group)}</span>
              <span className="text-emerald-400 font-medium w-16 text-right">+{group.xp} XP</span>
            </div>
          </li>
        ))}
      </ul>

      {workout.notes && (
        <p className="mt-3 pt-3 border-t border-gray-800 text-sm text-gray-400 italic">
          “{workout.notes}”
        </p>
      )}

      {canBump ? (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <FistBumpButton
            workoutId={workout.id}
            initialCount={bumps.length}
            initialBumped={viewerBumped}
          />
        </div>
      ) : bumps.length > 0 ? (
        <p className="mt-3 pt-3 border-t border-gray-800 text-sm text-gray-400">
          🤜 <span className="font-semibold text-white">{bumps.length}</span> fist bump{bumps.length === 1 ? '' : 's'} from friends
        </p>
      ) : null}
    </div>
  )
}

// Recent workouts list shown on profiles. `canBump` turns on the fist-bump
// button — pass true only when the viewer is looking at a friend's profile.
export function WorkoutHistory({
  workouts,
  viewerId,
  canBump,
  emptyMessage,
}: {
  workouts:     WorkoutWithBumps[]
  viewerId:     string
  canBump:      boolean
  emptyMessage: string
}) {
  return (
    <section>
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent workouts</h2>
      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map(workout => (
            <WorkoutCard key={workout.id} workout={workout} viewerId={viewerId} canBump={canBump} />
          ))}
        </div>
      )}
    </section>
  )
}
