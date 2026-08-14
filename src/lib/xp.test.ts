import { describe, expect, it } from 'vitest'
import { levelProgress, nextStreak, xpForSet, xpToLevel } from './xp'

describe('xpToLevel', () => {
  it('starts at level 1 with 0 xp', () => {
    expect(xpToLevel(0)).toBe(1)
  })

  it('stays level 1 just below the first threshold', () => {
    expect(xpToLevel(499)).toBe(1)
  })

  it('reaches level 2 exactly at the first threshold', () => {
    expect(xpToLevel(500)).toBe(2)
  })

  it('compounds the threshold by x1.5 (integer math) per level', () => {
    // level 2 threshold is floor(500 * 1.5) = 750
    expect(xpToLevel(500 + 749)).toBe(2)
    expect(xpToLevel(500 + 750)).toBe(3)
  })
})

describe('levelProgress', () => {
  it('reports progress within the current level', () => {
    expect(levelProgress(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForLevel: 500 })
  })

  it('carries remaining xp into the next level band', () => {
    expect(levelProgress(600)).toEqual({ level: 2, xpIntoLevel: 100, xpForLevel: 750 })
  })
})

describe('xpForSet', () => {
  it('awards reps x difficulty multiplier for rep-based exercises', () => {
    const exercise = { type: 'reps' as const, difficulty_multiplier: 2 }
    expect(xpForSet(exercise, 10, null)).toBe(20)
  })

  it('floors negative/missing reps at zero', () => {
    const exercise = { type: 'reps' as const, difficulty_multiplier: 2 }
    expect(xpForSet(exercise, null, null)).toBe(0)
  })

  it('awards 1 xp per 3 seconds (rounded up) x multiplier for duration exercises', () => {
    const exercise = { type: 'duration' as const, difficulty_multiplier: 3 }
    expect(xpForSet(exercise, null, 10)).toBe(Math.ceil(10 / 3) * 3)
  })

  it('floors negative/missing duration at zero', () => {
    const exercise = { type: 'duration' as const, difficulty_multiplier: 3 }
    expect(xpForSet(exercise, null, null)).toBe(0)
  })
})

describe('nextStreak', () => {
  const now = new Date('2026-08-14T12:00:00Z')

  it('starts a streak at 1 with no prior workout', () => {
    expect(nextStreak(null, 0, now)).toBe(1)
  })

  it('keeps the current streak (min 1) for a second workout the same day', () => {
    expect(nextStreak('2026-08-14T06:00:00Z', 4, now)).toBe(4)
    expect(nextStreak('2026-08-14T06:00:00Z', 0, now)).toBe(1)
  })

  it('increments the streak for a workout the very next day', () => {
    expect(nextStreak('2026-08-13T23:00:00Z', 4, now)).toBe(5)
  })

  it('resets the streak to 1 after a missed day', () => {
    expect(nextStreak('2026-08-10T12:00:00Z', 6, now)).toBe(1)
  })
})
