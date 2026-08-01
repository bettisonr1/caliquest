'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, Sparkles, Zap } from 'lucide-react'
import { completeOnboardingAction } from '@/app/onboarding/actions'
import { xpToLevel } from '@/lib/xp'
import type { OnboardingOutcome } from '@/lib/services/onboarding.service'
import type { Difficulty, MuscleGroup, Skill, SkillPrerequisite } from '@/types/database'

const GROUP_ORDER: MuscleGroup[] = ['pull', 'push', 'core', 'legs', 'mobility']

const groupMeta: Record<MuscleGroup, { label: string; accent: string; blurb: string }> = {
  pull:     { label: 'Pull',     accent: 'text-blue-400',    blurb: 'Hanging, rowing, and pull-up strength.' },
  push:     { label: 'Push',     accent: 'text-orange-400',  blurb: 'Push-ups, dips, and pressing overhead.' },
  core:     { label: 'Core',     accent: 'text-yellow-400',  blurb: 'Holds and compression strength.' },
  legs:     { label: 'Legs',     accent: 'text-emerald-400', blurb: 'Squatting on two legs — and one.' },
  mobility: { label: 'Mobility', accent: 'text-purple-400',  blurb: 'Bridges, hangs, and healthy shoulders.' },
}

const difficultyLabel: Record<Difficulty, { label: string; className: string }> = {
  beginner:     { label: 'Beginner',     className: 'bg-emerald-500/20 text-emerald-400' },
  intermediate: { label: 'Intermediate', className: 'bg-blue-500/20 text-blue-400'       },
  advanced:     { label: 'Advanced',     className: 'bg-orange-500/20 text-orange-400'   },
  elite:        { label: 'Elite',        className: 'bg-purple-500/20 text-purple-400'   },
}

type Props = {
  skills: Skill[]
  prerequisites: SkillPrerequisite[]
  username: string
}

export function OnboardingFlow({ skills, prerequisites, username }: Props) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<OnboardingOutcome | null>(null)

  const skillById = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills])

  const { ancestorsOf, descendantsOf } = useMemo(() => {
    const prereqMap = new Map<string, string[]>()
    const childMap = new Map<string, string[]>()
    for (const p of prerequisites) {
      prereqMap.set(p.skill_id, [...(prereqMap.get(p.skill_id) ?? []), p.prerequisite_skill_id])
      childMap.set(p.prerequisite_skill_id, [...(childMap.get(p.prerequisite_skill_id) ?? []), p.skill_id])
    }
    const closure = (start: string, edges: Map<string, string[]>) => {
      const seen = new Set<string>()
      const stack = [start]
      while (stack.length > 0) {
        const id = stack.pop()!
        if (seen.has(id)) continue
        seen.add(id)
        for (const next of edges.get(id) ?? []) stack.push(next)
      }
      return seen
    }
    return {
      ancestorsOf: (id: string) => closure(id, prereqMap),
      descendantsOf: (id: string) => closure(id, childMap),
    }
  }, [prerequisites])

  const skillsByGroup = useMemo(() => {
    const byGroup = {} as Record<MuscleGroup, Skill[]>
    for (const group of GROUP_ORDER) {
      byGroup[group] = skills
        .filter(s => s.muscle_group === group)
        .sort((a, b) => a.sort_order - b.sort_order)
    }
    return byGroup
  }, [skills])

  // Selecting a skill claims its whole prerequisite chain; deselecting drops
  // everything that builds on it.
  function toggleSkill(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        for (const d of descendantsOf(id)) next.delete(d)
      } else {
        for (const a of ancestorsOf(id)) next.add(a)
      }
      return next
    })
  }

  // Mirrors the server's seeding: highest claimed threshold per muscle group.
  const projected = useMemo(() => {
    const thresholdByGroup: Partial<Record<MuscleGroup, number>> = {}
    for (const id of selected) {
      const skill = skillById.get(id)
      if (!skill) continue
      thresholdByGroup[skill.muscle_group] = Math.max(
        thresholdByGroup[skill.muscle_group] ?? 0,
        skill.required_mg_xp
      )
    }
    const xp = Object.values(thresholdByGroup).reduce((sum, t) => sum + t, 0)
    return { xp, level: xpToLevel(xp) }
  }, [selected, skillById])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const result = await completeOnboardingAction([...selected])
    if (result.ok === false) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    setOutcome(result.outcome)
  }

  if (outcome) {
    return (
      <CelebrationScreen outcome={outcome} username={username} />
    )
  }

  const isReviewStep = step === GROUP_ORDER.length
  const group = isReviewStep ? null : GROUP_ORDER[step]

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28">
      <div className="flex items-center justify-between mb-6">
        <span className="font-bold text-lg tracking-tight text-white">
          Cali<span className="text-emerald-400">Quest</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          <Zap className="h-4 w-4" />
          Starting level {projected.level}
        </span>
      </div>

      <div className="flex gap-1.5 mb-8">
        {[...GROUP_ORDER.map((_, i) => i), GROUP_ORDER.length].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-emerald-500' : i === step ? 'bg-emerald-500/60' : 'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {group ? (
        <GroupStep
          group={group}
          skills={skillsByGroup[group]}
          selected={selected}
          onToggle={toggleSkill}
          isFirstStep={step === 0}
        />
      ) : (
        <ReviewStep
          skillsByGroup={skillsByGroup}
          selected={selected}
          projectedLevel={projected.level}
          projectedXp={projected.xp}
        />
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400">
          Something went wrong ({error}). Please try again.
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {!isReviewStep && (
            <button
              type="button"
              onClick={() => { setSelected(new Set()); setStep(GROUP_ORDER.length) }}
              className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Skip — I&apos;m new to this
            </button>
          )}
          {isReviewStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'Setting up…' : 'Begin your quest'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupStep({
  group,
  skills,
  selected,
  onToggle,
  isFirstStep,
}: {
  group: MuscleGroup
  skills: Skill[]
  selected: Set<string>
  onToggle: (id: string) => void
  isFirstStep: boolean
}) {
  const meta = groupMeta[group]
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">
        <span className={meta.accent}>{meta.label}</span> — what can you already do?
      </h1>
      <p className="text-gray-400 text-sm mt-1">{meta.blurb} Tap everything you can do with solid form — easier skills come along automatically.</p>
      {isFirstStep && (
        <p className="text-emerald-400/80 text-xs mt-2">
          Be honest — you&apos;ll level up faster starting from where you really are.
        </p>
      )}

      <div className="mt-5 space-y-2">
        {skills.map(skill => {
          const isSelected = selected.has(skill.id)
          const diff = difficultyLabel[skill.difficulty]
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onToggle(skill.id)}
              className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-gray-700/60 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-gray-600'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                  {skill.name}
                </span>
                {skill.description && (
                  <span className="block text-xs text-gray-500 mt-0.5 truncate">{skill.description}</span>
                )}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${diff.className}`}>
                {diff.label}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Nothing here you can do yet? Just hit Next — everyone starts somewhere.
      </p>
    </div>
  )
}

function ReviewStep({
  skillsByGroup,
  selected,
  projectedLevel,
  projectedXp,
}: {
  skillsByGroup: Record<MuscleGroup, Skill[]>
  selected: Set<string>
  projectedLevel: number
  projectedXp: number
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Your starting point</h1>
      <p className="text-gray-400 text-sm mt-1">
        Skills you claim are unlocked for logging right away. Everything else stays locked — that&apos;s what you&apos;re training toward.
      </p>

      <div className="mt-5 rounded-xl border border-emerald-500/40 bg-gray-900 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Starting level</p>
          <p className="text-3xl font-bold text-white">{projectedLevel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Starting XP</p>
          <p className="text-lg font-semibold text-emerald-400 flex items-center gap-1 justify-end">
            <Zap className="h-4 w-4" />
            {projectedXp.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {GROUP_ORDER.map(group => {
          const claimed = skillsByGroup[group].filter(s => selected.has(s.id))
          const highest = claimed.reduce<Skill | null>(
            (best, s) => (!best || s.required_mg_xp > best.required_mg_xp ? s : best),
            null
          )
          return (
            <div key={group} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
              <span className={`text-sm font-semibold ${groupMeta[group].accent}`}>
                {groupMeta[group].label}
              </span>
              <span className="text-sm text-gray-300">
                {highest ? `${highest.name} (${claimed.length} skill${claimed.length === 1 ? '' : 's'})` : 'Starting fresh'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CelebrationScreen({ outcome, username }: { outcome: OnboardingOutcome; username: string }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/15 mb-6">
        <Sparkles className="h-8 w-8 text-emerald-400" />
      </div>
      <h1 className="text-3xl font-bold text-white">
        Welcome, <span className="text-emerald-400">{username}</span>
      </h1>
      <p className="mt-3 text-gray-400">Your quest begins at</p>
      <p className="mt-1 text-6xl font-bold text-white">Level {outcome.level}</p>
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-300">
        <span className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-emerald-400" />
          {outcome.totalXp.toLocaleString()} XP
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="h-4 w-4 text-emerald-400" />
          {outcome.skillsRecorded} skills unlocked
        </span>
      </div>
      <Link
        href="/dashboard"
        className="mt-10 inline-block px-8 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors"
      >
        Enter CaliQuest
      </Link>
    </div>
  )
}
