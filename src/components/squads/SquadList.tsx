import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import type { SquadListEntry } from '@/lib/services/squads.service'

export function SquadList({ squads }: { squads: SquadListEntry[] }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-3">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">
        My squads {squads.length > 0 && `(${squads.length})`}
      </h2>

      {squads.length === 0 ? (
        <p className="text-sm text-gray-500">
          You&apos;re not in a squad yet — create one below to train with friends.
        </p>
      ) : (
        <ul className="space-y-2">
          {squads.map(({ membership, memberCount }) => (
            <li key={membership.squad_id}>
              <Link
                href={`/squads/${membership.squad_id}`}
                className="flex items-center justify-between gap-3 py-1 -my-1 rounded-lg hover:bg-gray-800/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{membership.squads.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {memberCount} member{memberCount === 1 ? '' : 's'}
                    </span>
                    {membership.role === 'leader' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400">
                        Leader
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
