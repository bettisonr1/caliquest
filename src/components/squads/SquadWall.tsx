'use client'

import type { SquadWallData } from '@/lib/services/squads.service'
import { SquadDetailsCard } from './SquadDetailsCard'
import { SquadMembers } from './SquadMembers'
import { SquadPostFeed } from './SquadPostFeed'

export function SquadWall({ wall, viewerId }: { wall: SquadWallData; viewerId: string }) {
  const isLeader = wall.role === 'leader'

  return (
    <div className="space-y-6">
      <SquadDetailsCard squad={wall.squad} canEdit={isLeader} />
      <SquadMembers
        squadId={wall.squad.id}
        members={wall.members}
        invitableFriends={wall.invitableFriends}
        viewerId={viewerId}
        isLeader={isLeader}
      />
      <SquadPostFeed squadId={wall.squad.id} posts={wall.posts} isLeader={isLeader} />
    </div>
  )
}
