import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { generateQuest } from '@/lib/services/quest-generation.service'
import {
  completeUserQuest,
  deactivateQuest,
  expireUserQuest,
  getActiveGeneratedQuests,
  getUserQuestsWithQuest,
  insertUserQuest,
  updateUserQuestProgress,
} from '@/lib/repositories/quests.repository'
import {
  getMuscleGroupXP,
  getProfile,
  updateMuscleGroupXP,
  updateProfileXP,
} from '@/lib/repositories/profiles.repository'
import { xpToLevel } from '@/lib/xp'
import type { MuscleGroup, Quest, UserQuestWithQuest } from '@/types/database'

export type QuestBoard = {
  offered: Quest | null
  active: UserQuestWithQuest | null
  history: UserQuestWithQuest[]
}

function isExpired(userQuest: UserQuestWithQuest, now: Date = new Date()): boolean {
  return userQuest.expires_at !== null && new Date(userQuest.expires_at) < now
}

// Marks any overdue active quest as expired, returning the corrected list.
async function withLazyExpiry(
  supabase: SupabaseClient,
  userQuests: UserQuestWithQuest[]
): Promise<UserQuestWithQuest[]> {
  const result: UserQuestWithQuest[] = []
  for (const uq of userQuests) {
    if (uq.status === 'active' && isExpired(uq)) {
      await expireUserQuest(supabase, uq.id)
      result.push({ ...uq, status: 'expired' })
    } else {
      result.push(uq)
    }
  }
  return result
}

export async function getQuestBoard(userId: string): Promise<QuestBoard> {
  const supabase = await createClient()

  const [generated, userQuests] = await Promise.all([
    getActiveGeneratedQuests(supabase, userId),
    getUserQuestsWithQuest(supabase, userId),
  ])

  const quests = await withLazyExpiry(supabase, userQuests)
  const acceptedQuestIds = new Set(quests.map(uq => uq.quest_id))

  return {
    offered: generated.find(q => !acceptedQuestIds.has(q.id)) ?? null,
    active: quests.find(uq => uq.status === 'active') ?? null,
    history: quests.filter(uq => uq.status !== 'active'),
  }
}

export async function generateQuestOffer(userId: string): Promise<Quest> {
  const supabase = await createClient()

  const board = await getQuestBoard(userId)
  if (board.offered) throw new Error('QUEST_ALREADY_OFFERED')
  if (board.active) throw new Error('QUEST_ALREADY_ACTIVE')

  const quest = await generateQuest(supabase, userId)
  if (!quest) throw new Error('NO_UNLOCKED_EXERCISES')
  return quest
}

export async function acceptQuest(userId: string, questId: string): Promise<void> {
  const supabase = await createClient()

  const board = await getQuestBoard(userId)
  if (board.active) throw new Error('QUEST_ALREADY_ACTIVE')
  if (board.offered?.id !== questId) throw new Error('QUEST_NOT_OFFERED')

  const expiresAt = new Date(
    Date.now() + board.offered.duration_days * 24 * 60 * 60 * 1000
  ).toISOString()
  await insertUserQuest(supabase, userId, questId, expiresAt)
}

export async function declineQuest(userId: string, questId: string): Promise<void> {
  const supabase = await createClient()
  await deactivateQuest(supabase, userId, questId)
}

export type QuestWorkoutOutcome = {
  bonusXp: number
  completedQuestTitles: string[]
}

// Called after a workout is saved: advance any active quest by the base XP
// earned in its target muscle group, and on completion award the bonus to
// total XP and the target group's XP.
export async function applyWorkoutToQuests(
  supabase: SupabaseClient,
  userId: string,
  mgXpGained: Partial<Record<MuscleGroup, number>>
): Promise<QuestWorkoutOutcome> {
  const userQuests = await withLazyExpiry(supabase, await getUserQuestsWithQuest(supabase, userId))
  const outcome: QuestWorkoutOutcome = { bonusXp: 0, completedQuestTitles: [] }

  for (const uq of userQuests) {
    if (uq.status !== 'active') continue
    const group = uq.quests.target_muscle_group
    if (!group) continue

    const gained = mgXpGained[group] ?? 0
    if (gained <= 0) continue

    const progress = uq.progress + gained
    if (progress < uq.quests.target_count) {
      await updateUserQuestProgress(supabase, uq.id, progress)
      continue
    }

    await completeUserQuest(supabase, uq.id, { progress, bonus_xp: uq.quests.xp_reward })
    outcome.bonusXp += uq.quests.xp_reward
    outcome.completedQuestTitles.push(uq.quests.title)

    const [profile, mgXp] = await Promise.all([
      getProfile(supabase, userId),
      getMuscleGroupXP(supabase, userId),
    ])
    const newTotal = profile.total_xp + uq.quests.xp_reward
    await Promise.all([
      updateProfileXP(supabase, userId, { total_xp: newTotal, level: xpToLevel(newTotal) }),
      updateMuscleGroupXP(supabase, userId, group, (mgXp[group] ?? 0) + uq.quests.xp_reward),
    ])
  }

  return outcome
}
