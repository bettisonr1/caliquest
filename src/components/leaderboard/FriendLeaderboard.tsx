import { Avatar } from '@/components/profile/Avatar'
import type { FriendLeaderboardEntry } from '@/types/database'

export function FriendLeaderboard({ entries }: { entries: FriendLeaderboardEntry[] }) {
  if (entries.length <= 1) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center">
        <p className="text-gray-400 text-sm">
          Add friends to see how you stack up — no one to rank yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <ul className="space-y-1">
        {entries.map((entry, i) => (
          <li
            key={entry.user_id}
            className={`flex items-center gap-3 rounded-lg -mx-2 px-2 py-2 ${
              entry.isViewer ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : ''
            }`}
          >
            <span className="w-5 text-xs text-gray-500 font-medium shrink-0">{i + 1}</span>
            <Avatar avatarUrl={entry.profile.avatar_url} size="sm" />
            <span className="text-sm text-white font-medium truncate flex-1">
              {entry.profile.username}
              {entry.isViewer && <span className="text-gray-500 font-normal"> (you)</span>}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {entry.workout_count} workout{entry.workout_count === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
