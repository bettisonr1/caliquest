import Link from 'next/link'
import { Lock, CheckCircle, Zap } from 'lucide-react'
import { SkillUnlockButton } from './SkillUnlockButton'
import { XPBar } from './XPBar'
import { difficultyLabel, muscleGroupBorder } from '@/lib/skill-display'
import type { SkillWithStatus } from '@/types/database'

export function SkillCard({ skill }: { skill: SkillWithStatus }) {
  const { status, name, difficulty, required_mg_xp, user_mg_xp, is_recorded } = skill
  const diff = difficultyLabel[difficulty]
  const borderColor = muscleGroupBorder[skill.muscle_group]

  const isUnlocked      = status === 'unlocked'
  const isInProgress    = status === 'in_progress'
  const isLocked        = status === 'locked'
  const readyToUnlock   = isUnlocked && !is_recorded

  return (
    <div
      className={[
        'rounded-xl border bg-gray-900 p-4 transition-all',
        isUnlocked   ? `${borderColor} shadow-sm`                     : '',
        isInProgress ? 'border-emerald-500/30 bg-gray-900'            : '',
        isLocked     ? 'border-gray-700/50 opacity-50'                : '',
      ].join(' ')}
    >
      <Link href={`/skills/${skill.id}`} className="block">
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
          <div className="mt-3">
            <XPBar current={user_mg_xp} required={required_mg_xp} />
          </div>
        )}

        {isUnlocked && !readyToUnlock && (
          <p className="mt-2 text-[11px] text-emerald-400 font-medium">Unlocked</p>
        )}
      </Link>

      {readyToUnlock && <SkillUnlockButton skillId={skill.id} className="mt-2" />}
    </div>
  )
}
