'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { acceptQuest, declineQuest, generateQuestOffer } from '@/lib/services/quests.service'
import { askGuru, type GuruChatMessage } from '@/lib/services/guru.service'

type ActionResult = { ok: true } | { ok: false; error: string }

const questErrorMessages: Record<string, string> = {
  QUEST_ALREADY_OFFERED: 'You already have a quest waiting — accept or decline it first.',
  QUEST_ALREADY_ACTIVE:  'Finish your current quest before taking on a new one.',
  QUEST_NOT_OFFERED:     'That quest is no longer available.',
  NO_UNLOCKED_EXERCISES: 'Unlock some skills before taking on a quest.',
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function toActionError(e: unknown): { ok: false; error: string } {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
  return { ok: false, error: questErrorMessages[code] ?? 'Something went wrong. Please try again.' }
}

export async function generateQuestAction(): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await generateQuestOffer(user.id)
    revalidatePath('/quests')
    return { ok: true }
  } catch (e) {
    return toActionError(e)
  }
}

export async function acceptQuestAction(questId: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await acceptQuest(user.id, questId)
    revalidatePath('/quests')
    return { ok: true }
  } catch (e) {
    return toActionError(e)
  }
}

export async function declineQuestAction(questId: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    await declineQuest(user.id, questId)
    revalidatePath('/quests')
    return { ok: true }
  } catch (e) {
    return toActionError(e)
  }
}

export type AskGuruResult = { ok: true; reply: string } | { ok: false; error: string }

export async function askGuruAction(
  userQuestId: string,
  messages: GuruChatMessage[]
): Promise<AskGuruResult> {
  const user = await requireUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const reply = await askGuru(user.id, userQuestId, messages)
    return { ok: true, reply }
  } catch {
    return { ok: false, error: 'Your guru is meditating right now. Try again in a moment.' }
  }
}
