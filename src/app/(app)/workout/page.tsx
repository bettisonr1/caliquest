import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkoutLoggingOptions } from '@/lib/services/workout-logging.service'
import { LogWorkoutForm } from '@/components/workout/LogWorkoutForm'

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { skills, exercisesBySkillId } = await getWorkoutLoggingOptions(user.id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Log Workout</h1>
        <p className="text-gray-400 text-sm mt-1">
          Pick a skill you&apos;ve unlocked, log your sets and reps.
        </p>
      </div>

      {skills.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Unlock a skill first, then come back to log a workout.
        </p>
      ) : (
        <LogWorkoutForm skills={skills} exercisesBySkillId={exercisesBySkillId} />
      )}
    </div>
  )
}
