import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { RankBadge } from './RankBadge'
import type { PassportEntry } from '@/types/database'

export function GymPassport({ entries }: { entries: PassportEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Passport</h2>
        <p className="text-sm text-gray-500">
          Tag a workout to a gym to start your passport —{' '}
          <Link href="/gyms" className="text-emerald-400 font-medium hover:text-emerald-300">
            find one nearby
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
        Passport <span className="text-gray-500 normal-case font-normal">· {entries.length} gym{entries.length === 1 ? '' : 's'}</span>
      </h2>
      <ul className="space-y-1">
        {entries.map(entry => (
          <li key={entry.gym_id}>
            <Link
              href={`/gyms/${entry.gym_id}`}
              className="flex items-center justify-between gap-2 py-2 -mx-2 px-2 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-sm text-white truncate">
                  {entry.gym_name ?? 'Unnamed spot'}
                </span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">{entry.workout_count}×</span>
                <RankBadge rank={entry.rank} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
