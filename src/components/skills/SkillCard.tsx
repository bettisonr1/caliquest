'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, Zap } from 'lucide-react'
import { unlockSkillAction } from '@/app/(app)/skills/actions'
import type { SkillWithStatus, Difficulty, MuscleGroup } from '@/types/database'

const difficultyLabel: Record<Difficulty, { label: string; className: string }> = {
  beginner:     { label: 'Beginner',     className: 'bg-emerald-500/20 text-emerald-400' },
  intermediate: { label: 'Intermediate', className: 'bg-blue-500/20 text-blue-400'       },
  advanced:     { label: 'Advanced',     className: 'bg-orange-500/20 text-orange-400'   },
  elite:        { label: 'Elite',        className: 'bg-purple-500/20 text-purple-400'   },
}

const muscleGroupColor: Record<MuscleGroup, string> = {
  pull:     'border-blue-500/40',
  push:     'border-orange-500/40',
  core:     'border-yellow-500/40',
  legs:     'border-emerald-500/40',
  mobility: 'border-purple-500/40',
}

function XPBar({ current, required }: { current: number; required: number }) {
  const pct = required === 0 ? 100 : Math.min(100, Math.round((current / required) * 100))
  return (
    <div className="mt-3 space-y-1">
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

export function SkillCard({ skill }: { skill: SkillWithStatus }) {
  const router = useRouter()
  const { status, name, difficulty, required_mg_xp, user_mg_xp, is_recorded } = skill
  const diff = difficultyLabel[difficulty]
  const borderColor = muscleGroupColor[skill.muscle_group]

  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const isUnlocked      = status === 'unlocked'
  const isInProgress    = status === 'in_progress'
  const isLocked        = status === 'locked'
  const readyToUnlock   = isUnlocked && !is_recorded

  async function handleUnlock() {
    setUnlocking(true)
    setUnlockError(null)
    const result = await unlockSkillAction(skill.id)
    if (result.ok === false) {
      setUnlockError(result.error)
      setUnlocking(false)
      return
    }
    router.refresh()
  }

  return (
    <div
      className={[
        'rounded-xl border bg-gray-900 p-4 transition-all',
        isUnlocked   ? `${borderColor} shadow-sm`                     : '',
        isInProgress ? 'border-emerald-500/30 bg-gray-900'            : '',
        isLocked     ? 'border-gray-700/50 opacity-50'                : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diff.className}`}>
          {diff.label}
        </span>
        {isUnlocked && !readyToUnlock && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
        {(isInProgress || readyToUnlock) && <Zap className="h-4 w-4 text-emerald-400 shrink-0" />}
        {isLocked && <Lock className="h-4 w-4 text-gray-600 shrink-0" />}
      </div>

      <p className={`text-sm font-semibold leading-tight ${isUnlocked ? 'text-white' : 'text-gray-300'}`}>
        {name}
      </p>

      {!isUnlocked && required_mg_xp > 0 && (
        <XPBar current={user_mg_xp} required={required_mg_xp} />
      )}

      {isUnlocked && !readyToUnlock && (
        <p className="mt-2 text-[11px] text-emerald-400 font-medium">Unlocked</p>
      )}

      {readyToUnlock && (
        <div className="mt-2 space-y-1">
          <button
            type="button"
            onClick={handleUnlock}
            disabled={unlocking}
            className="w-full text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white transition-colors"
          >
            {unlocking ? 'Unlocking…' : 'Unlock'}
          </button>
          {unlockError && (
            <p className="text-[10px] text-red-400">{unlockError}</p>
          )}
        </div>
      )}
    </div>
  )
}
