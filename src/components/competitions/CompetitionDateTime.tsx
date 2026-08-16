'use client'

// Timestamps are stored as UTC ISO strings; formatting happens client-side
// (undefined locale = browser default) so an event reads in the viewer's
// own timezone rather than the server's — same pattern as
// SquadPostFeed/NotificationBell's formatTimestamp.
export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CompetitionDateTime({ startAt, endAt }: { startAt: string; endAt: string | null }) {
  if (!endAt) return <>{formatEventDate(startAt)}</>
  return (
    <>
      {formatEventDate(startAt)} – {formatEventDate(endAt)}
    </>
  )
}
