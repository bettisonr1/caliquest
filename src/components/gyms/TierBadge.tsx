import type { GymTier } from '@/types/database'

const tierStyles: Record<GymTier, string> = {
  'Rumored Spot': 'bg-gray-700 text-gray-300',
  'Spot':         'bg-gray-700 text-gray-200',
  'Yard':         'bg-blue-500/20 text-blue-300',
  'Forge':        'bg-orange-500/20 text-orange-300',
  'Dojo':         'bg-purple-500/20 text-purple-300',
  'Temple':       'bg-yellow-500/20 text-yellow-300',
}

export function TierBadge({ tier }: { tier: GymTier }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tierStyles[tier]}`}>
      {tier}
    </span>
  )
}

export function tierMarkerColor(tier: GymTier): string {
  switch (tier) {
    case 'Rumored Spot': return '#6b7280'
    case 'Spot':         return '#9ca3af'
    case 'Yard':         return '#60a5fa'
    case 'Forge':        return '#fb923c'
    case 'Dojo':         return '#c084fc'
    case 'Temple':       return '#facc15'
  }
}
