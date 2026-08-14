'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { deleteAccountAction } from '@/app/(app)/profile/actions'

type Props = { username: string }

// Guideline 5.1.1(v) account deletion. Typing the username back is the
// confirmation step — cheap to do, hard to do by accident, and needs no
// extra modal/dialog component. Kept as its own always-expandable card
// (not hidden behind a settings menu) so a reviewer can find it in seconds.
export function DeleteAccountSection({ username }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const matches = confirmText.trim().length > 0 && confirmText.trim() === username

  function cancel() {
    setConfirming(false)
    setConfirmText('')
    setError(null)
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAccountAction()
      if (result.ok === false) {
        setError(result.error)
        return
      }
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border border-red-900/60 bg-red-950/20 p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest">Danger zone</h2>
      </div>

      {!confirming ? (
        <>
          <p className="text-sm text-gray-400 mt-2">
            Permanently delete your account and everything tied to it — workouts, skills,
            quests, friends, and squad memberships. This can&apos;t be undone.
          </p>
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 px-4 py-2.5 -m-0.5 rounded-lg bg-red-500/10 border border-red-800 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
          >
            Delete account
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-400">
            Type <span className="font-mono text-white">{username}</span> to confirm. Your
            account is deleted immediately — there&apos;s no recovery.
          </p>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={username}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type your username to confirm account deletion"
            className="w-full max-w-xs rounded-lg bg-gray-900 border border-red-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={!matches || isPending}
              className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-400 disabled:opacity-40 disabled:hover:bg-red-500 transition-colors"
            >
              {isPending ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              onClick={cancel}
              disabled={isPending}
              className="px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
