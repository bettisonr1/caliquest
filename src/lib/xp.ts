import type { Exercise } from '@/types/database'

// Mirrors public.xp_to_level in supabase/schema.sql:
// level 1 starts at 0 XP, each level needs ×1.5 more XP (integer math), starting at 500.
export function xpToLevel(xp: number): number {
  let level = 1
  let threshold = 500
  let remaining = xp
  while (remaining >= threshold) {
    remaining -= threshold
    level += 1
    threshold = Math.floor((threshold * 15) / 10)
  }
  return level
}

// Progress within the current level, for rendering an XP bar.
export function levelProgress(xp: number): {
  level: number
  xpIntoLevel: number
  xpForLevel: number
} {
  let level = 1
  let threshold = 500
  let remaining = xp
  while (remaining >= threshold) {
    remaining -= threshold
    level += 1
    threshold = Math.floor((threshold * 15) / 10)
  }
  return { level, xpIntoLevel: remaining, xpForLevel: threshold }
}

// XP for a single set: reps × difficulty multiplier, or 1 XP per 3 seconds
// held × multiplier for duration-based exercises.
export function xpForSet(
  exercise: Pick<Exercise, 'type' | 'difficulty_multiplier'>,
  reps: number | null,
  durationSeconds: number | null
): number {
  if (exercise.type === 'reps') {
    return Math.max(0, reps ?? 0) * exercise.difficulty_multiplier
  }
  return Math.ceil(Math.max(0, durationSeconds ?? 0) / 3) * exercise.difficulty_multiplier
}

// Streak: consecutive calendar days (UTC) with at least one workout.
export function nextStreak(lastWorkoutAt: string | null, currentStreak: number, now: Date = new Date()): number {
  if (!lastWorkoutAt) return 1
  const last = new Date(lastWorkoutAt)
  const dayMs = 24 * 60 * 60 * 1000
  const lastDay = Math.floor(last.getTime() / dayMs)
  const today = Math.floor(now.getTime() / dayMs)
  if (today === lastDay) return Math.max(1, currentStreak)
  if (today === lastDay + 1) return currentStreak + 1
  return 1
}
