import { describe, expect, it } from 'vitest'
import { DEFAULT_AVATAR, parseAvatar, serializeAvatar } from './avatar'

describe('parseAvatar', () => {
  it('falls back to the default for null', () => {
    expect(parseAvatar(null)).toEqual(DEFAULT_AVATAR)
  })

  it('falls back to the default for a legacy (non "cq1:") avatar_url', () => {
    expect(parseAvatar('https://example.com/legacy-avatar.png')).toEqual(DEFAULT_AVATAR)
  })

  it('parses a well-formed cq1 avatar string', () => {
    expect(parseAvatar('cq1:🦍:blue')).toEqual({ emoji: '🦍', background: 'blue' })
  })

  it('falls back to the default when the background is not a known key', () => {
    expect(parseAvatar('cq1:🦍:not-a-real-background')).toEqual(DEFAULT_AVATAR)
  })

  it('falls back to the default when the emoji segment is missing', () => {
    expect(parseAvatar('cq1::blue')).toEqual(DEFAULT_AVATAR)
  })
})

describe('serializeAvatar', () => {
  it('round-trips through parseAvatar', () => {
    const config = { emoji: '🔥', background: 'gold' as const }
    expect(parseAvatar(serializeAvatar(config))).toEqual(config)
  })
})
