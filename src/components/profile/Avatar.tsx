import { AVATAR_BACKGROUNDS, parseAvatar } from '@/lib/avatar'

const sizes = {
  sm: 'h-10 w-10 text-xl',
  md: 'h-16 w-16 text-3xl',
  lg: 'h-24 w-24 text-5xl',
} as const

export function Avatar({
  avatarUrl,
  size = 'md',
}: {
  avatarUrl: string | null
  size?: keyof typeof sizes
}) {
  const { emoji, background } = parseAvatar(avatarUrl)
  return (
    <div
      className={`${sizes[size]} ${AVATAR_BACKGROUNDS[background]} rounded-full flex items-center justify-center select-none shrink-0 ring-2 ring-gray-800`}
    >
      <span>{emoji}</span>
    </div>
  )
}
