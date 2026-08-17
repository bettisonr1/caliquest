'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { unlockSkillAction } from '@/app/(app)/skills/actions'

type Props = {
  skillId: string
  /** 'card' = compact button for the skill tree card. 'detail' = full-width CTA on the skill detail page. */
  variant?: 'card' | 'detail'
  className?: string
}

const buttonClass = {
  card:   'w-full text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white transition-colors',
  detail: 'w-full text-sm font-semibold px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white transition-colors',
}

export function SkillUnlockButton({ skillId, variant = 'card', className }: Props) {
  const router = useRouter()
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUnlock() {
    setUnlocking(true)
    setError(null)
    const result = await unlockSkillAction(skillId)
    if (result.ok === false) {
      setError(result.error)
      setUnlocking(false)
      return
    }
    router.refresh()
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleUnlock}
        disabled={unlocking}
        className={buttonClass[variant]}
      >
        {unlocking ? 'Unlocking…' : 'Unlock'}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
