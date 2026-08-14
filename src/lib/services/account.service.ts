import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

// Permanently deletes a user's Supabase auth account. Everything the user
// *owns* cascades automatically via `on delete cascade` foreign keys in
// supabase/schema.sql: profiles -> auth.users, and from there
// muscle_group_xp, user_skills, workouts (and workout_sets/fistbumps off
// those), user_quests, generated quests, friendships, squad_members,
// squad_posts, notifications, gym_reviews, gym_suggestions/votes all key off
// profiles.user_id. Rows the user merely *created* rather than owns
// (gyms.created_by, squads.created_by) use `on delete set null` instead, so
// a gym or squad they set up survives for other members instead of
// vanishing with their account.
//
// Required by App Store Guideline 5.1.1(v) — see APP_STORE_DEPLOYMENT.md §4.
// Deleting the auth.users row (rather than soft-deleting/anonymizing) is
// deliberate: Apple requires the data to actually be removed, not just
// hidden.
export async function deleteAccount(userId: string): Promise<void> {
  const log = logger.child({ userId, feature: 'account', action: 'deleteAccount' })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    log.error({ err: error }, 'deleteAccount failed')
    throw new Error('DELETE_FAILED')
  }

  log.info('Account and all owned data deleted')
}
