import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock, Lock, Repeat, Sparkles, Zap } from 'lucide-react'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getSkillDetail } from '@/lib/services/skills.service'
import { SkillDemoVideo } from '@/components/skills/SkillDemoVideo'
import { SkillUnlockButton } from '@/components/skills/SkillUnlockButton'
import { XPBar } from '@/components/skills/XPBar'
import { difficultyLabel, muscleGroupChip, muscleGroupLabel } from '@/lib/skill-display'
import type { SkillWithStatus } from '@/types/database'

function StatusPill({ skill }: { skill: SkillWithStatus }) {
  if (skill.status === 'unlocked' && skill.is_recorded) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" /> Unlocked
      </span>
    )
  }
  if (skill.status === 'unlocked') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
        <Zap className="h-3.5 w-3.5" /> Ready to unlock
      </span>
    )
  }
  if (skill.status === 'in_progress') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
        <Zap className="h-3.5 w-3.5" /> In progress
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
      <Lock className="h-3.5 w-3.5" /> Locked
    </span>
  )
}

function SkillListItem({ skill }: { skill: SkillWithStatus }) {
  return (
    <li>
      <Link
        href={`/skills/${skill.id}`}
        className="flex items-center justify-between gap-3 py-3 -my-2 rounded-lg px-1 -mx-1 hover:bg-gray-800/60 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          {skill.status === 'locked'
            ? <Lock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            : <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${skill.is_recorded ? 'text-emerald-400' : 'text-gray-600'}`} />}
          <span className="text-sm text-gray-200 truncate">{skill.name}</span>
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${muscleGroupChip[skill.muscle_group]}`}>
          {muscleGroupLabel[skill.muscle_group]}
        </span>
      </Link>
    </li>
  )
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const detail = await getSkillDetail(user.id, id)
  if (!detail) notFound()

  const { skill, prerequisites, unlocks, exercises } = detail
  const diff = difficultyLabel[skill.difficulty]
  const readyToUnlock = skill.status === 'unlocked' && !skill.is_recorded

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 py-2 -my-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Skills
      </Link>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${diff.className}`}>
            {diff.label}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${muscleGroupChip[skill.muscle_group]}`}>
            {muscleGroupLabel[skill.muscle_group]}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mt-3">{skill.name}</h1>
        {skill.description && (
          <p className="text-gray-400 text-sm mt-1.5">{skill.description}</p>
        )}

        <div className="mt-4">
          <StatusPill skill={skill} />
        </div>

        {skill.status !== 'unlocked' && skill.required_mg_xp > 0 && (
          <div className="mt-4">
            <XPBar current={skill.user_mg_xp} required={skill.required_mg_xp} />
          </div>
        )}

        {readyToUnlock && <SkillUnlockButton skillId={skill.id} variant="detail" className="mt-5" />}

        {skill.status === 'unlocked' && skill.is_recorded && (
          <Link
            href="/workout"
            className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            Log a workout
          </Link>
        )}
      </div>

      {skill.demo_video_url && (
        <SkillDemoVideo url={skill.demo_video_url} skillName={skill.name} />
      )}

      {skill.form_cues.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-white uppercase tracking-widest mb-3">
            <Sparkles className="h-4 w-4 text-emerald-400" /> What good form feels like
          </h2>
          <ul className="space-y-2.5">
            {skill.form_cues.map((cue, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">
            Exercises {skill.status === 'unlocked' ? '' : '(unlock to log these)'}
          </h2>
          <ul className="space-y-1">
            {exercises.map(exercise => (
              <li key={exercise.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="flex items-center gap-2 min-w-0 text-gray-300">
                  {exercise.type === 'duration'
                    ? <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    : <Repeat className="h-3.5 w-3.5 text-gray-500 shrink-0" />}
                  <span className="truncate">{exercise.name}</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 shrink-0">
                  ×{exercise.difficulty_multiplier}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prerequisites.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Prerequisites</h2>
          <ul className="divide-y divide-gray-800">
            {prerequisites.map(p => <SkillListItem key={p.id} skill={p} />)}
          </ul>
        </div>
      )}

      {unlocks.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Unlocks next</h2>
          <ul className="divide-y divide-gray-800">
            {unlocks.map(s => <SkillListItem key={s.id} skill={s} />)}
          </ul>
        </div>
      )}
    </div>
  )
}
