'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { completeOnboarding, type OnboardingOutcome } from '@/lib/services/onboarding.service'

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'NOT_AUTHENTICATED' }

  try {
    const outcome = await completeOnboarding(user.id, claimedSkillIds)
    revalidatePath('/dashboard')
    revalidatePath('/skills')
    revalidatePath('/workout')
    return { ok: true, outcome }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'UNKNOWN_ERROR' }
  }
}
