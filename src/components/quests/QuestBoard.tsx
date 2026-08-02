'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Clock, ScrollText, Sparkles, XCircle, Zap } from 'lucide-react'
import { acceptQuestAction, declineQuestAction, generateQuestAction } from '@/app/(app)/quests/actions'
import type { QuestBoard as QuestBoardData } from '@/lib/services/quests.service'
import type { MuscleGroup, Quest, UserQuestWithQuest } from '@/types/database'
import { GuruChat } from './GuruChat'

const groupChip: Record<MuscleGroup, string> = {
  pull:     'bg-blue-500/20 text-blue-400',
  push:     'bg-orange-500/20 text-orange-400',
  core:     'bg-yellow-500/20 text-yellow-400',
  legs:     'bg-emerald-500/20 text-emerald-400',
  mobility: 'bg-purple-500/20 text-purple-400',
}

function GroupChip({ group }: { group: MuscleGroup | null }) {
  if (!group) return null
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${groupChip[group]}`}>
      {group}
    </span>
  )
}

function daysLeft(expiresAt: string | null): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}

function OfferedQuestCard({ quest }: { quest: Quest }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const respond = (action: (id: string) => Promise<{ ok: boolean } | { ok: false; error: string }>) => {
    setError(null)
    startTransition(async () => {
      const result = await action(quest.id)
      if ('error' in result) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-yellow-500/40 bg-gray-900 p-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">
        <ScrollText className="h-4 w-4" /> New quest offer
      </div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-white">{quest.title}</h2>
        <GroupChip group={quest.target_muscle_group} />
      </div>
      <p className="mt-2 text-sm text-gray-400">{quest.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-gray-300">
          <Zap className="h-4 w-4 text-emerald-400" />
          Earn <span className="font-semibold text-white">{quest.target_count} XP</span> in {quest.duration_days} days
        </span>
        <span className="flex items-center gap-1.5 text-gray-300">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          Bonus: <span className="font-semibold text-yellow-400">+{quest.xp_reward} XP</span> (1.5× total)
        </span>
      </div>
      {quest.guru_name && (
        <div className="mt-4 rounded-xl bg-gray-800/60 border border-gray-800 p-4">
          <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-1">
            Your guru: {quest.guru_name}
          </p>
          <p className="text-sm text-gray-400 italic">&ldquo;{quest.guru_greeting}&rdquo;</p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-5 flex gap-3">
        <button
          onClick={() => respond(acceptQuestAction)}
          disabled={isPending}
          className="px-5 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          Accept quest
        </button>
        <button
          onClick={() => respond(declineQuestAction)}
          disabled={isPending}
          className="px-5 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

function ActiveQuestCard({ userQuest }: { userQuest: UserQuestWithQuest }) {
  const quest = userQuest.quests
  const progressPct = Math.min(100, Math.round((userQuest.progress / quest.target_count) * 100))
  const remaining = daysLeft(userQuest.expires_at)

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-gray-900 p-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
        <ScrollText className="h-4 w-4" /> Active quest
      </div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-white">{quest.title}</h2>
        <GroupChip group={quest.target_muscle_group} />
      </div>
      <p className="mt-2 text-sm text-gray-400">{quest.description}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-300">
            <span className="font-semibold text-white">{userQuest.progress}</span> / {quest.target_count} XP
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {remaining} day{remaining === 1 ? '' : 's'} left
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Complete for <span className="text-yellow-400 font-semibold">+{quest.xp_reward} bonus XP</span> —
          log {quest.target_muscle_group} exercises to make progress.
        </p>
      </div>

      <GuruChat userQuest={userQuest} />
    </div>
  )
}

function HistoryList({ history }: { history: UserQuestWithQuest[] }) {
  if (history.length === 0) return null
  return (
    <div>
      <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Past quests</h2>
      <ul className="space-y-2">
        {history.map(uq => (
          <li
            key={uq.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {uq.status === 'completed'
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                : <XCircle className="h-5 w-5 text-gray-600 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{uq.quests.title}</p>
                <p className="text-xs text-gray-500">
                  {uq.status === 'completed'
                    ? `Completed · +${uq.bonus_xp} bonus XP`
                    : `Expired · ${uq.progress}/${uq.quests.target_count} XP`}
                </p>
              </div>
            </div>
            <GroupChip group={uq.quests.target_muscle_group} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SeekQuestCard() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const seek = () => {
    setError(null)
    startTransition(async () => {
      const result = await generateQuestAction()
      if ('error' in result) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-700 p-10 text-center">
      <ScrollText className="h-8 w-8 text-gray-600 mx-auto mb-3" />
      <p className="text-gray-400 font-medium">No quest underway</p>
      <p className="text-sm text-gray-500 mt-1">
        Seek a quest and we&apos;ll forge one aimed at your weakest area.
      </p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        onClick={seek}
        disabled={isPending}
        className="mt-5 px-5 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Consulting the gurus…' : 'Seek a quest'}
      </button>
    </div>
  )
}

export function QuestBoard({ board }: { board: QuestBoardData }) {
  return (
    <div className="max-w-2xl space-y-6">
      {board.active
        ? <ActiveQuestCard userQuest={board.active} />
        : board.offered
          ? <OfferedQuestCard quest={board.offered} />
          : <SeekQuestCard />}
      <HistoryList history={board.history} />
    </div>
  )
}
