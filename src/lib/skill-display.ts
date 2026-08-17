import type { Difficulty, MuscleGroup } from '@/types/database'

// Shared label/color maps for rendering skills — used by the skill tree,
// skill cards, and the skill detail page so badge styling stays consistent.

export const difficultyLabel: Record<Difficulty, { label: string; className: string }> = {
  beginner:     { label: 'Beginner',     className: 'bg-emerald-500/20 text-emerald-400' },
  intermediate: { label: 'Intermediate', className: 'bg-blue-500/20 text-blue-400'       },
  advanced:     { label: 'Advanced',     className: 'bg-orange-500/20 text-orange-400'   },
  elite:        { label: 'Elite',        className: 'bg-purple-500/20 text-purple-400'   },
}

export const muscleGroupLabel: Record<MuscleGroup, string> = {
  pull:     'Pull',
  push:     'Push',
  core:     'Core',
  legs:     'Legs',
  mobility: 'Mobility',
}

// Border accent used on skill cards.
export const muscleGroupBorder: Record<MuscleGroup, string> = {
  pull:     'border-blue-500/40',
  push:     'border-orange-500/40',
  core:     'border-yellow-500/40',
  legs:     'border-emerald-500/40',
  mobility: 'border-purple-500/40',
}

// Text accent used on headings/labels.
export const muscleGroupText: Record<MuscleGroup, string> = {
  pull:     'text-blue-400',
  push:     'text-orange-400',
  core:     'text-yellow-400',
  legs:     'text-emerald-400',
  mobility: 'text-purple-400',
}

// Pill/chip background+text used for compact badges.
export const muscleGroupChip: Record<MuscleGroup, string> = {
  pull:     'bg-blue-500/20 text-blue-400',
  push:     'bg-orange-500/20 text-orange-400',
  core:     'bg-yellow-500/20 text-yellow-400',
  legs:     'bg-emerald-500/20 text-emerald-400',
  mobility: 'bg-purple-500/20 text-purple-400',
}
