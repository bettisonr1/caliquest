import type { GymRank } from '@/types/database'

const rankStyles: Record<GymRank, string> = {
  Visitor: 'bg-gray-700 text-gray-300',
  Local:   'bg-blue-500/20 text-blue-300',
  Regular: 'bg-emerald-500/20 text-emerald-300',
  Legend:  'bg-yellow-500/20 text-yellow-300',
}

export function RankBadge({ rank }: { rank: GymRank }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${rankStyles[rank]}`}>
      {rank}
    </span>
  )
}
