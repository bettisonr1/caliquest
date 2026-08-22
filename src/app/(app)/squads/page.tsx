import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getSquadsPageData } from '@/lib/services/squads.service'
import { CreateSquadForm } from '@/components/squads/CreateSquadForm'
import { SquadInvites } from '@/components/squads/SquadInvites'
import { SquadList } from '@/components/squads/SquadList'

export default async function SquadsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const { mySquads, invites } = await getSquadsPageData(user.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Squads</h1>
        <p className="text-gray-400 text-sm mt-1">
          Train with friends. Leaders keep the squad wall updated with meeting times and places.
        </p>
      </div>

      {invites.length > 0 && <SquadInvites invites={invites} />}

      <SquadList squads={mySquads} />

      <CreateSquadForm />
    </div>
  )
}
