'use client'

import Link from 'next/link'
import { CalendarDays, MapPin, Trophy } from 'lucide-react'
import { formatEventDate } from './CompetitionDateTime'

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

type Props = {
  id: string
  name: string
  imageUrl: string | null
  startAt: string
  gymName?: string | null
  distanceM?: number | null
  badge?: string
}

export function CompetitionCard({ id, name, imageUrl, startAt, gymName, distanceM, badge }: Props) {
  return (
    <Link
      href={`/competitions/${id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
    >
      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote, user-supplied Storage URLs; no next/image domain config for this bucket
          <img src={imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Trophy className="h-5 w-5 text-gray-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {formatEventDate(startAt)}
        </p>
        {gymName && (
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{gymName}</span>
            {distanceM != null && <span className="shrink-0">· {formatDistance(distanceM)}</span>}
          </p>
        )}
      </div>

      {badge && (
        <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
          {badge}
        </span>
      )}
    </Link>
  )
}
