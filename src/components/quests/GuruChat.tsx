'use client'

import { useRef, useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { askGuruAction } from '@/app/(app)/quests/actions'
import type { GuruChatMessage } from '@/lib/services/guru.service'
import type { UserQuestWithQuest } from '@/types/database'

const MAX_INPUT_CHARS = 500

export function GuruChat({ userQuest }: { userQuest: UserQuestWithQuest }) {
  const quest = userQuest.quests
  const [messages, setMessages] = useState<GuruChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const send = () => {
    const content = input.trim().slice(0, MAX_INPUT_CHARS)
    if (!content || isPending) return
    const history = [...messages, { role: 'user' as const, content }]
    setMessages(history)
    setInput('')
    setError(null)
    startTransition(async () => {
      const result = await askGuruAction(userQuest.id, history)
      if (result.ok === false) {
        setError(result.error)
      } else {
        setMessages([...history, { role: 'assistant', content: result.reply }])
      }
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      })
    })
  }

  return (
    <div className="mt-5 rounded-xl bg-gray-800/60 border border-gray-800 p-4">
      <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-3">
        Guru {quest.guru_name ?? ''}
      </p>

      <div ref={scrollRef} className="max-h-64 overflow-y-auto space-y-3 pr-1">
        {quest.guru_greeting && (
          <div className="text-sm text-gray-300 bg-gray-800 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
            {quest.guru_greeting}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'text-sm text-gray-100 bg-emerald-500/15 rounded-lg rounded-tr-none px-3 py-2 max-w-[85%] ml-auto'
                : 'text-sm text-gray-300 bg-gray-800 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]'
            }
          >
            {m.content}
          </div>
        ))}
        {isPending && (
          <div className="text-sm text-gray-500 italic px-3 py-2">
            {quest.guru_name ?? 'Your guru'} is pondering…
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          maxLength={MAX_INPUT_CHARS}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Ask about form, progressions, motivation…"
          className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={send}
          disabled={isPending || input.trim() === ''}
          className="px-3 py-2 rounded-lg bg-emerald-500 text-gray-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          aria-label="Send message to guru"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
