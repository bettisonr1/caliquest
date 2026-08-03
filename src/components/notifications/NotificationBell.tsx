'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { getNotificationsAction, markAllReadAction } from '@/app/(app)/notifications/actions'
import type { Notification } from '@/types/database'

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function notificationHref(n: Notification): string {
  return n.squad_id ? `/squads/${n.squad_id}` : '/squads'
}

export function NotificationBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState<Notification[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      startTransition(async () => {
        const result = await getNotificationsAction()
        if (result.ok) setNotifications(result.data.notifications)
        await markAllReadAction()
        setUnreadCount(0)
      })
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-xl z-40 p-2">
            {isPending && notifications === null && (
              <p className="text-sm text-gray-500 px-3 py-4 text-center">Loading…</p>
            )}
            {notifications !== null && notifications.length === 0 && (
              <p className="text-sm text-gray-500 px-3 py-4 text-center">No notifications yet.</p>
            )}
            {notifications?.map(n => (
              <Link
                key={n.id}
                href={notificationHref(n)}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <p>{n.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(n.created_at)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
