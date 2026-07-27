// Composable avatar stored in profiles.avatar_url as "cq1:<emoji>:<background>".
// Anything else in avatar_url (e.g. a legacy image URL) falls back to the default.

export const AVATAR_EMOJIS = [
  '💪', '🦍', '🐺', '🦅', '🐉', '🥷',
  '🤸', '🏋️', '🧗', '🏃', '⚡', '🔥',
] as const

export const AVATAR_BACKGROUNDS = {
  emerald: 'bg-gradient-to-br from-emerald-500 to-teal-700',
  blue:    'bg-gradient-to-br from-blue-500 to-indigo-700',
  orange:  'bg-gradient-to-br from-orange-500 to-red-700',
  purple:  'bg-gradient-to-br from-purple-500 to-fuchsia-700',
  gold:    'bg-gradient-to-br from-yellow-400 to-amber-600',
  slate:   'bg-gradient-to-br from-slate-500 to-slate-800',
} as const

export type AvatarBackground = keyof typeof AVATAR_BACKGROUNDS

export type AvatarConfig = {
  emoji:      string
  background: AvatarBackground
}

export const DEFAULT_AVATAR: AvatarConfig = { emoji: '💪', background: 'emerald' }

export function parseAvatar(avatarUrl: string | null): AvatarConfig {
  if (!avatarUrl?.startsWith('cq1:')) return DEFAULT_AVATAR
  const [, emoji, background] = avatarUrl.split(':')
  if (!emoji || !(background in AVATAR_BACKGROUNDS)) return DEFAULT_AVATAR
  return { emoji, background: background as AvatarBackground }
}

export function serializeAvatar(config: AvatarConfig): string {
  return `cq1:${config.emoji}:${config.background}`
}
