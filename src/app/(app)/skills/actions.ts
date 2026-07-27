'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { unlockSkill } from '@/lib/services/skills.service'

export async function unlockSkillAction(
  skillId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'NOT_AUTHENTICATED' }

  try {
    await unlockSkill(user.id, skillId)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'UNKNOWN_ERROR' }
  }

  revalidatePath('/skills')
  return { ok: true }
}
