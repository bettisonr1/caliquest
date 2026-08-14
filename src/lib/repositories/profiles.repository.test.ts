import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilder, createSupabaseMock } from '@/test/helpers/supabase-mock'
import {
  claimOnboarding,
  getMuscleGroupXP,
  getProfilesByUserIds,
  updateProfileAfterWorkout,
  updateProfileXP,
} from './profiles.repository'

describe('getMuscleGroupXP', () => {
  it('reshapes the row list into a muscle_group -> xp map', async () => {
    const rows = [
      { muscle_group: 'push', xp: 100 },
      { muscle_group: 'pull', xp: 50 },
    ]
    const supabase = createSupabaseMock()
    supabase.from.mockReturnValue(createQueryBuilder({ data: rows, error: null }))

    const result = await getMuscleGroupXP(supabase as never, 'u1')

    expect(result).toEqual({ push: 100, pull: 50 })
  })

  it('returns an empty map when there are no rows', async () => {
    const supabase = createSupabaseMock()
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error: null }))

    expect(await getMuscleGroupXP(supabase as never, 'u1')).toEqual({})
  })
})

describe('getProfilesByUserIds', () => {
  it('short-circuits to an empty array without querying for an empty id list', async () => {
    const supabase = createSupabaseMock()

    const result = await getProfilesByUserIds(supabase as never, [])

    expect(result).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('queries profiles filtered by the given ids', async () => {
    const profiles = [{ user_id: 'u1' }, { user_id: 'u2' }]
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: profiles, error: null })
    supabase.from.mockReturnValue(builder)

    const result = await getProfilesByUserIds(supabase as never, ['u1', 'u2'])

    expect(builder.in).toHaveBeenCalledWith('user_id', ['u1', 'u2'])
    expect(result).toEqual(profiles)
  })
})

describe('claimOnboarding', () => {
  it('returns true when the conditional update matched a (not-yet-onboarded) row', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-14T12:00:00.000Z'))
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: [{ user_id: 'u1' }], error: null })
    supabase.from.mockReturnValue(builder)

    const claimed = await claimOnboarding(supabase as never, 'u1', { total_xp: 100, level: 1, onboarding_xp: 100 })

    expect(builder.update).toHaveBeenCalledWith({
      total_xp: 100,
      level: 1,
      onboarding_xp: 100,
      onboarded_at: '2026-08-14T12:00:00.000Z',
    })
    expect(builder.is).toHaveBeenCalledWith('onboarded_at', null)
    expect(claimed).toBe(true)
    vi.useRealTimers()
  })

  it('returns false when the profile was already onboarded (no rows matched)', async () => {
    const supabase = createSupabaseMock()
    supabase.from.mockReturnValue(createQueryBuilder({ data: [], error: null }))

    const claimed = await claimOnboarding(supabase as never, 'u1', { total_xp: 100, level: 1, onboarding_xp: 100 })

    expect(claimed).toBe(false)
  })
})

describe('updateProfileXP / updateProfileAfterWorkout', () => {
  it('updates xp/level fields for a bonus award', async () => {
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    await updateProfileXP(supabase as never, 'u1', { total_xp: 500, level: 2 })

    expect(builder.update).toHaveBeenCalledWith({ total_xp: 500, level: 2 })
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('updates xp/level/streak fields after a workout', async () => {
    const supabase = createSupabaseMock()
    const builder = createQueryBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)
    const fields = { total_xp: 600, level: 2, streak_days: 3, last_workout_at: '2026-08-14T12:00:00.000Z' }

    await updateProfileAfterWorkout(supabase as never, 'u1', fields)

    expect(builder.update).toHaveBeenCalledWith(fields)
  })

  it('throws on a Supabase error', async () => {
    const supabase = createSupabaseMock()
    const error = new Error('db error')
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error }))

    await expect(updateProfileXP(supabase as never, 'u1', { total_xp: 1, level: 1 })).rejects.toBe(error)
  })
})
