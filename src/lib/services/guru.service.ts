import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { getUserQuestWithQuestById } from '@/lib/repositories/quests.repository'
import { getUserUnlockedSkillIds } from '@/lib/repositories/skills.repository'
import { getAllExercises } from '@/lib/repositories/exercises.repository'

export type GuruChatMessage = { role: 'user' | 'assistant'; content: string }

const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_CHARS = 1000

function daysLeft(expiresAt: string | null): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}

export async function askGuru(
  userId: string,
  userQuestId: string,
  messages: GuruChatMessage[]
): Promise<string> {
  const log = logger.child({ userId, feature: 'guru-chat', userQuestId })
  const supabase = await createClient()

  const userQuest = await getUserQuestWithQuestById(supabase, userId, userQuestId)
  if (!userQuest) throw new Error('QUEST_NOT_FOUND')
  const quest = userQuest.quests

  const history = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    throw new Error('INVALID_CHAT_HISTORY')
  }

  const [unlockedIds, exercises] = await Promise.all([
    getUserUnlockedSkillIds(supabase, userId),
    getAllExercises(supabase),
  ])
  const questExercises = exercises
    .filter(e => e.muscle_group === quest.target_muscle_group)
    .filter(e => e.skill_id === null || unlockedIds.has(e.skill_id))
    .map(e => `${e.name}${e.description ? ` — ${e.description}` : ''}`)

  const anthropic = new Anthropic()

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1000,
      system:
        `You are ${quest.guru_name ?? 'the Guru'}, a calisthenics quest guru in CaliQuest, a ` +
        `workout RPG. Your persona: ${quest.guru_persona ?? 'a wise, encouraging coach'}\n\n` +
        `You are mentoring the user through this quest:\n` +
        `- Quest: ${quest.title}\n` +
        `- Goal: earn ${quest.target_count} ${quest.target_muscle_group} XP; ` +
        `progress so far: ${userQuest.progress} XP; ${daysLeft(userQuest.expires_at)} day(s) left\n` +
        `- Completion bonus: +${quest.xp_reward} XP\n` +
        `- Their unlocked ${quest.target_muscle_group} exercises:\n` +
        questExercises.map(e => `  - ${e}`).join('\n') +
        `\n\nStay in character. Give practical calisthenics form tips and honest motivation ` +
        `tied to their quest progress. Keep replies under 150 words. Prioritise safe technique ` +
        `over volume; suggest easier progressions when someone is struggling. Only recommend ` +
        `exercises from their unlocked list. You are not a medical professional — if asked ` +
        `about pain or injury, briefly advise rest and seeing a professional. If asked about ` +
        `things unrelated to training or the quest, steer back to the quest in character.`,
      messages: history,
    })
  } catch (err) {
    log.error({ err }, 'Guru chat request failed')
    throw err
  }

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
  if (!text) {
    log.warn({ stopReason: response.stop_reason }, 'Guru chat returned no text')
    throw new Error('GURU_NO_REPLY')
  }

  log.info({ replyLength: text.length, turns: history.length }, 'Guru chat reply generated')
  return text
}
