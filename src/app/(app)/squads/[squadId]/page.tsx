import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getSquadWall } from '@/lib/services/squads.service'
import { SquadWall } from '@/components/squads/SquadWall'

export default async function SquadWallPage({
  params,
}: {
  params: Promise<{ squadId: string }>
}) {
  const { squadId } = await params
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  let wall
  try {
    wall = await getSquadWall(user.id, squadId)
  } catch {
    redirect('/squads')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SquadWall wall={wall} viewerId={user.id} />
    </div>
  )
}
