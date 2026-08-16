import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, CalendarClock, MapPin, Ticket, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompetitionDetail } from '@/lib/services/competitions.service'
import { getProfile } from '@/lib/repositories/profiles.repository'
import { CompetitionDateTime } from '@/components/competitions/CompetitionDateTime'
import { RegisterButtons } from '@/components/competitions/RegisterButtons'
import { CancelCompetitionButton } from '@/components/competitions/CancelCompetitionButton'
import { Avatar } from '@/components/profile/Avatar'
import type { CompetitionParticipantStatusWithProfile, CompetitionSkillLevel } from '@/types/database'

const SKILL_LEVEL_LABELS: Record<CompetitionSkillLevel, string> = {
  open: 'Open to all',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

function formatFee(minorUnits: number | null, currency: string): string {
  if (!minorUnits) return 'Free'
  return `${currency} ${(minorUnits / 100).toFixed(2)}`
}

function ParticipantRow({ entry }: { entry: CompetitionParticipantStatusWithProfile }) {
  return (
    <li className="flex items-center gap-2.5">
      <Avatar avatarUrl={entry.profile?.avatar_url ?? null} size="sm" />
      <span className="text-sm text-white truncate">{entry.profile?.username ?? 'Anonymous'}</span>
      {entry.waitlisted && (
        <span className="ml-auto shrink-0 text-xs text-gray-500">#{entry.queue_position} waiting</span>
      )}
    </li>
  )
}

export default async function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [detail, profile] = await Promise.all([
    getCompetitionDetail(id, user.id),
    getProfile(supabase, user.id),
  ])

  if (!detail) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-400 font-medium">This competition isn&apos;t available</p>
          <Link
            href="/competitions"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-emerald-400 font-medium hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to competitions
          </Link>
        </div>
      </div>
    )
  }

  const {
    competition,
    gym,
    participants,
    competingCount,
    waitlistCount,
    attendingCount,
    viewerStatus,
    canRegisterToCompete,
    canAttend,
    registrationClosed,
  } = detail
  const isCancelled = competition.status === 'cancelled'

  const competing = participants.filter(p => p.intent === 'competing' && !p.waitlisted)
  const waitlisted = participants.filter(p => p.intent === 'competing' && p.waitlisted)
  const attending = participants.filter(p => p.intent === 'attending')

  const isOrganizer = competition.created_by === user.id || profile.is_admin

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 py-2 -my-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Competitions
      </Link>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        {competition.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied Storage URL
          <img src={competition.image_url} alt="" className="h-48 w-full object-cover" />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-white">{competition.name}</h1>
            {isCancelled && (
              <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
                Cancelled
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2 text-sm text-gray-400">
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <CompetitionDateTime startAt={competition.start_at} endAt={competition.end_at} />
            </p>
            {gym && (
              <Link href={`/gyms/${gym.id}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <MapPin className="h-4 w-4 shrink-0" />
                {gym.name ?? 'View gym'}
              </Link>
            )}
            <p className="flex items-center gap-2">
              <Ticket className="h-4 w-4 shrink-0" />
              {formatFee(competition.entry_fee_minor_units, competition.currency)} to compete
              {' · '}
              {SKILL_LEVEL_LABELS[competition.skill_level]}
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              {competingCount} competing
              {competition.capacity != null && ` / ${competition.capacity} spots`}
              {waitlistCount > 0 && ` · ${waitlistCount} waiting`}
              {' · '}
              {attendingCount} attending
            </p>
            {competition.registration_deadline && (
              <p className="text-xs text-gray-500">
                Registration to compete {registrationClosed ? 'closed' : 'closes'}{' '}
                <CompetitionDateTime startAt={competition.registration_deadline} endAt={null} />
              </p>
            )}
          </div>

          {competition.description && (
            <p className="mt-4 text-sm text-gray-300 whitespace-pre-wrap">{competition.description}</p>
          )}

          {competition.external_registration_url && (
            <a
              href={competition.external_registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300 underline"
            >
              External registration / more details
            </a>
          )}

          {!isCancelled && (
            <div className="mt-5">
              <RegisterButtons
                competitionId={competition.id}
                initialStatus={viewerStatus}
                canRegisterToCompete={canRegisterToCompete}
                canAttend={canAttend}
              />
            </div>
          )}

          {isOrganizer && !isCancelled && (
            <div className="mt-4 flex justify-end">
              <CancelCompetitionButton competitionId={competition.id} />
            </div>
          )}
        </div>
      </div>

      {(competing.length > 0 || waitlisted.length > 0) && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Competing</h2>
          <ul className="space-y-2.5">
            {competing.map(p => <ParticipantRow key={p.user_id} entry={p} />)}
          </ul>
          {waitlisted.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2.5">Waitlist</h3>
              <ul className="space-y-2.5">
                {waitlisted.map(p => <ParticipantRow key={p.user_id} entry={p} />)}
              </ul>
            </>
          )}
        </div>
      )}

      {attending.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Attending</h2>
          <ul className="space-y-2.5">
            {attending.map(p => <ParticipantRow key={p.user_id} entry={p} />)}
          </ul>
        </div>
      )}
    </div>
  )
}
