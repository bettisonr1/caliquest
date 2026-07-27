'use client'

import { SkillCard } from './SkillCard'
import type { MuscleGroup, SkillWithStatus } from '@/types/database'

const columns: { group: MuscleGroup; label: string; color: string }[] = [
  { group: 'pull',     label: 'Pull',     color: 'text-blue-400'    },
  { group: 'push',     label: 'Push',     color: 'text-orange-400'  },
  { group: 'core',     label: 'Core',     color: 'text-yellow-400'  },
  { group: 'legs',     label: 'Legs',     color: 'text-emerald-400' },
  { group: 'mobility', label: 'Mobility', color: 'text-purple-400'  },
]

type Props = {
  skills:       SkillWithStatus[]
  mgXp:         Record<MuscleGroup, number>
}

export function SkillsTree({ skills, mgXp }: Props) {
  const byGroup = (group: MuscleGroup) =>
    skills
      .filter(s => s.muscle_group === group)
      .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map(({ group, label, color }) => (
          <div key={group} className="w-56 shrink-0">
            {/* Column header */}
            <div className="mb-4 pb-2 border-b border-gray-800">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${color}`}>
                {label}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {(mgXp[group] ?? 0).toLocaleString()} XP
              </p>
            </div>

            {/* Skill cards with connector lines */}
            <div className="relative flex flex-col gap-0">
              {byGroup(group).map((skill, i, arr) => (
                <div key={skill.id} className="relative">
                  {/* Connector line down to next card */}
                  {i < arr.length - 1 && (
                    <div className="absolute left-6 top-full w-px h-3 bg-gray-700 z-10" />
                  )}
                  <div className="mb-3">
                    <SkillCard skill={skill} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
