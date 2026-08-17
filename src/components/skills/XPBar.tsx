import { Zap } from 'lucide-react'

export function XPBar({ current, required }: { current: number; required: number }) {
  const pct = required === 0 ? 100 : Math.min(100, Math.round((current / required) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{current.toLocaleString()} XP</span>
        <span>{required.toLocaleString()} needed</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
