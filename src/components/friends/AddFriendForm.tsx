'use client'

import { useEffect, useState, useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { searchUsersAction, sendFriendRequestAction } from '@/app/(app)/friends/actions'
import { Avatar } from '@/components/profile/Avatar'
import type { PublicProfile } from '@/types/database'

export function AddFriendForm() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchUsersAction(trimmed)
        if (result.ok === false) {
          setError(result.error)
          setResults([])
        } else {
          setError(null)
          setResults(result.results)
        }
      })
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  function handleAdd(targetUserId: string) {
    startTransition(async () => {
      const result = await sendFriendRequestAction(targetUserId)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setSentTo(prev => new Set(prev).add(targetUserId))
      }
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-3">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">Add a friend</h2>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by username…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map(profile => (
            <li key={profile.user_id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar avatarUrl={profile.avatar_url} size="sm" />
                <span className="text-sm text-white truncate">{profile.username}</span>
              </div>
              <button
                onClick={() => handleAdd(profile.user_id)}
                disabled={isPending || sentTo.has(profile.user_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-gray-950 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {sentTo.has(profile.user_id) ? 'Requested' : 'Add'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
