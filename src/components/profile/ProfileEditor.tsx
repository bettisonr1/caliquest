'use client'

import { useState, useTransition } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { updateProfile } from '@/app/(app)/profile/actions'
import { AVATAR_BACKGROUNDS, AVATAR_EMOJIS, parseAvatar } from '@/lib/avatar'
import type { AvatarBackground } from '@/lib/avatar'

type Props = {
  username:  string
  avatarUrl: string | null
}

export function ProfileEditor({ username: initialUsername, avatarUrl }: Props) {
  const initialAvatar = parseAvatar(avatarUrl)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(initialUsername)
  const [emoji, setEmoji] = useState(initialAvatar.emoji)
  const [background, setBackground] = useState<AvatarBackground>(initialAvatar.background)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const cancel = () => {
    setUsername(initialUsername)
    setEmoji(initialAvatar.emoji)
    setBackground(initialAvatar.background)
    setError(null)
    setEditing(false)
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateProfile({
        username,
        avatarEmoji: emoji,
        avatarBackground: background,
      })
      if (result.ok) {
        setEditing(false)
      } else {
        setError(result.error)
      }
    })
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit profile
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Edit profile</h2>
        <button onClick={cancel} className="text-gray-500 hover:text-white transition-colors" aria-label="Cancel editing">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="profile-username" className="block text-xs font-semibold text-gray-400 mb-1.5">
          Username
        </label>
        <input
          id="profile-username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={20}
          className="w-full max-w-xs rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Avatar emoji */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-1.5">Avatar</p>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                emoji === e ? 'bg-emerald-500/30 ring-2 ring-emerald-500' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              aria-label={`Avatar ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Avatar background */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-1.5">Background</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AVATAR_BACKGROUNDS) as AvatarBackground[]).map(bg => (
            <button
              key={bg}
              onClick={() => setBackground(bg)}
              className={`h-8 w-8 rounded-full ${AVATAR_BACKGROUNDS[bg]} transition-transform ${
                background === bg ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
              }`}
              aria-label={`Background ${bg}`}
            >
              {background === bg && <Check className="h-4 w-4 text-white mx-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex items-center gap-3 pt-1">
        <div className={`h-12 w-12 rounded-full ${AVATAR_BACKGROUNDS[background]} flex items-center justify-center text-2xl ring-2 ring-gray-800`}>
          {emoji}
        </div>
        <span className="text-sm text-gray-300 font-medium">{username || '—'}</span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={cancel}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
