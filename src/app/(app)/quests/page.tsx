import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getQuestBoard } from '@/lib/services/quests.service'
import { QuestBoard } from '@/components/quests/QuestBoard'

export default async function QuestsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const board = await getQuestBoard(user.id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Sidequests</h1>
      <p className="text-gray-400 text-sm mt-1 mb-6">
        Quests target your weakest area — complete them for 1.5× XP, with a guru at your side.
      </p>
      <QuestBoard board={board} />
    </div>
  )
}
