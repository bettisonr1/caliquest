import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { getMuscleGroupXP } from '@/lib/repositories/profiles.repository'
import { getUserUnlockedSkillIds } from '@/lib/repositories/skills.repository'
import { getAllExercises } from '@/lib/repositories/exercises.repository'
import { getWorkoutsSince } from '@/lib/repositories/workouts.repository'
import { createQuest } from '@/lib/repositories/quests.repository'
import type { Exercise, MuscleGroup, Quest } from '@/types/database'

const QUEST_DURATION_DAYS = 7
const MIN_TARGET_XP = 100
const MAX_TARGET_XP = 750
const VOLUME_LOOKBACK_DAYS = 14

// The muscle-group order used to break XP ties, so targeting is deterministic.
const GROUP_ORDER: MuscleGroup[] = ['push', 'pull', 'core', 'legs', 'mobility']

export type QuestTargeting = {
  muscleGroup: MuscleGroup
  targetXp: number
  exercises: Exercise[]
}

// Pick the lowest-XP muscle group the user can actually train (has at least
// one unlocked exercise), and size the target from their recent volume.
export async function pickQuestTarget(
  supabase: SupabaseClient,
  userId: string
): Promise<QuestTargeting | null> {
  const [mgXp, unlockedIds, exercises] = await Promise.all([
    getMuscleGroupXP(supabase, userId),
    getUserUnlockedSkillIds(supabase, userId),
    getAllExercises(supabase),
  ])

  const unlockedByGroup = new Map<MuscleGroup, Exercise[]>()
  for (const exercise of exercises) {
    if (exercise.skill_id !== null && !unlockedIds.has(exercise.skill_id)) continue
    const list = unlockedByGroup.get(exercise.muscle_group) ?? []
    list.push(exercise)
    unlockedByGroup.set(exercise.muscle_group, list)
  }

  const candidates = GROUP_ORDER
    .filter(group => (unlockedByGroup.get(group)?.length ?? 0) > 0)
    .sort((a, b) => (mgXp[a] ?? 0) - (mgXp[b] ?? 0))
  const muscleGroup = candidates[0]
  if (!muscleGroup) return null

  const since = new Date(Date.now() - VOLUME_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const recent = await getWorkoutsSince(supabase, userId, since)
  let recentGroupXp = 0
  for (const workout of recent) {
    for (const set of workout.workout_sets) {
      if (set.exercises?.muscle_group === muscleGroup) recentGroupXp += set.xp_earned
    }
  }
  const weekly = recentGroupXp / (VOLUME_LOOKBACK_DAYS / 7)

  // Push slightly past the recent weekly rate, rounded to a clean number and
  // clamped so a generated quest can never be trivial or absurd.
  const raw = Math.round((weekly * 1.25) / 10) * 10
  const targetXp = Math.min(MAX_TARGET_XP, Math.max(MIN_TARGET_XP, raw))

  return { muscleGroup, targetXp, exercises: unlockedByGroup.get(muscleGroup) ?? [] }
}

const questFlavorSchema = z.object({
  title: z.string(),
  description: z.string(),
  guru: z.object({
    name: z.string(),
    persona: z.string(),
    greeting: z.string(),
  }),
})

type QuestFlavor = z.infer<typeof questFlavorSchema>

function fallbackFlavor(target: QuestTargeting): QuestFlavor {
  const group = target.muscleGroup
  const label = group.charAt(0).toUpperCase() + group.slice(1)
  return {
    title: `${label} Power Week`,
    description:
      `Your ${group} training is falling behind the rest — earn ${target.targetXp} ${label} XP ` +
      `in the next ${QUEST_DURATION_DAYS} days using any of your unlocked ${group} exercises.`,
    guru: {
      name: 'Master Kalos',
      persona:
        'A patient, veteran calisthenics coach who values strict form over big numbers and ' +
        'speaks in short, encouraging sentences.',
      greeting:
        `So, your ${group} work needs attention. Good — knowing your weakness is the first step. ` +
        `Train with clean form and the XP will follow. Ask me anything about the movements.`,
    },
  }
}

async function generateQuestFlavor(
  target: QuestTargeting,
  context: { userId: string }
): Promise<QuestFlavor> {
  const log = logger.child({ userId: context.userId, feature: 'quest-generation' })
  const anthropic = new Anthropic()

  try {
    const response = await anthropic.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 2000,
      system:
        'You write sidequests for CaliQuest, a calisthenics RPG where users earn XP per muscle ' +
        'group by logging workouts. Given a quest target, produce: a punchy quest title (max 6 ' +
        'words, adventure-flavored, no quotes), a 1–2 sentence description that states the goal ' +
        'in plain terms (the XP amount, the muscle group, the time limit) with some flavor, and ' +
        'a guru — an invented mentor character for this quest. The guru needs a name (2–3 words, ' +
        'e.g. "Sifu Ren", "Iron Magda"), a persona (2–3 sentences describing their coaching ' +
        'style and voice, used to roleplay them later), and a greeting (2–3 sentences, in ' +
        'character, welcoming the user to the quest and inviting form questions). Keep it ' +
        'grounded in calisthenics; never invent exercises outside the provided list.',
      messages: [
        {
          role: 'user',
          content:
            `Target muscle group: ${target.muscleGroup} (the user's weakest area)\n` +
            `Goal: earn ${target.targetXp} XP in that muscle group within ${QUEST_DURATION_DAYS} days\n` +
            `Completion bonus: +${Math.round(target.targetXp / 2)} XP (work pays 1.5× if completed)\n` +
            `The user's unlocked ${target.muscleGroup} exercises: ` +
            target.exercises.map(e => e.name).join(', '),
        },
      ],
      output_config: {
        format: zodOutputFormat(questFlavorSchema),
      },
    })

    if (!response.parsed_output) {
      log.warn('Quest flavor generation returned no parsed output, using fallback')
      return fallbackFlavor(target)
    }
    log.info({ title: response.parsed_output.title }, 'Quest flavor generated')
    return response.parsed_output
  } catch (err) {
    log.error({ err }, 'Quest flavor generation failed, using fallback')
    return fallbackFlavor(target)
  }
}

// Generate and persist a quest offer for the user's weakest trainable muscle
// group. Returns null if the user has no unlocked exercises at all.
export async function generateQuest(
  supabase: SupabaseClient,
  userId: string
): Promise<Quest | null> {
  const target = await pickQuestTarget(supabase, userId)
  if (!target) return null

  const flavor = await generateQuestFlavor(target, { userId })

  return createQuest(supabase, {
    user_id: userId,
    title: flavor.title,
    description: flavor.description,
    target_muscle_group: target.muscleGroup,
    target_count: target.targetXp,
    xp_reward: Math.round(target.targetXp / 2),
    duration_days: QUEST_DURATION_DAYS,
    guru_name: flavor.guru.name,
    guru_persona: flavor.guru.persona,
    guru_greeting: flavor.guru.greeting,
  })
}
