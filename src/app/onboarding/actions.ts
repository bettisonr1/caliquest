'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { completeOnboarding, type OnboardingOutcome } from '@/lib/services/onboarding.service'

// Mirrors middleware.ts's ONBOARDED_COOKIE — set here too so the redirect
// right after completing onboarding doesn't need to wait on middleware to
// re-derive it from the DB on the next request.
const ONBOARDED_COOKIE = 'cq_onboarded'
const ONBOARDED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function completeOnboardingAction(
  claimedSkillIds: string[]
): Promise<{ ok: true; outcome: OnboardingOutcome } | { ok: false; error: string }> {
  if (
    !Array.isArray(claimedSkillIds) ||
    claimedSkillIds.length > 200 ||
    claimedSkillIds.some(id => typeof id !== 'string')
  ) {
    return { ok: false, error: 'INVALID_INPUT' }
  }

  const { data: { user } } = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'NOT_AUTHENTICATED' }

  try {
    const outcome = await completeOnboarding(user.id, claimedSkillIds)
    const cookieStore = await cookies()
    cookieStore.set(ONBOARDED_COOKIE, '1', {
      path: '/',
      maxAge: ONBOARDED_COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
    revalidatePath('/dashboard')
    revalidatePath('/skills')
    revalidatePath('/workout')
    return { ok: true, outcome }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'UNKNOWN_ERROR' }
  }
}
