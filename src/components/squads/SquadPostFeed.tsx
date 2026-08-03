'use client'

import { useState, useTransition } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { postToWallAction } from '@/app/(app)/squads/actions'
import { Avatar } from '@/components/profile/Avatar'
import type { SquadPostWithAuthor } from '@/types/database'

const MAX_POST_CHARS = 1000

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function SquadPostFeed({
  squadId,
  posts,
  isLeader,
}: {
  squadId: string
  posts: SquadPostWithAuthor[]
  isLeader: boolean
}) {
  const [content, setContent] = useState('')
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    const trimmed = content.trim()
    if (trimmed === '') return
    setError(null)
    startTransition(async () => {
      const result = await postToWallAction(squadId, trimmed, isAnnouncement)
      if (result.ok === false) {
        setError(result.error)
        return
      }
      setContent('')
      setIsAnnouncement(false)
    })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">Squad wall</h2>

      <div className="space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={MAX_POST_CHARS}
          rows={2}
          placeholder="Post to the squad…"
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          {isLeader ? (
            <label className="flex items-center gap-1.5 text-xs text-gray-400 select-none">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={e => setIsAnnouncement(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Megaphone className="h-3.5 w-3.5" /> Announce (notifies everyone)
            </label>
          ) : (
            <span />
          )}
          <button
            onClick={submit}
            disabled={isPending || content.trim() === ''}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="h-3.5 w-3.5" /> Post
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">No posts yet — say hello to your squad.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map(post => (
            <li
              key={post.id}
              className={
                post.is_announcement
                  ? 'rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-3'
                  : 'rounded-xl border border-gray-800 bg-gray-800/40 p-3'
              }
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar avatarUrl={post.author?.avatar_url ?? null} size="sm" />
                <span className="text-sm font-medium text-white">
                  {post.author?.username ?? 'Unknown'}
                </span>
                {post.is_announcement && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400">
                    <Megaphone className="h-2.5 w-2.5" /> Announcement
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-500 shrink-0">
                  {formatTimestamp(post.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
