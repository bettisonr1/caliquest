import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getWorkoutLoggingOptions } from '@/lib/services/workout-logging.service'
import { WorkoutBuilder } from '@/components/workout/WorkoutBuilder'

export default async function WorkoutPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const { exercisesBySkillId } = await getWorkoutLoggingOptions(user.id)
  const exercises = Object.values(exercisesBySkillId)
    .flat()
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Log Workout</h1>
        <p className="text-gray-400 text-sm mt-1">
          Build your workout from any exercises you&apos;ve unlocked, log your sets, earn XP.
        </p>
      </div>

      {exercises.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Unlock a skill first, then come back to log a workout.
        </p>
      ) : (
        <WorkoutBuilder exercises={exercises} />
      )}
    </div>
  )
}
