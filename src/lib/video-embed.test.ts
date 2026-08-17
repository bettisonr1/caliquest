import { describe, expect, it } from 'vitest'
import { toVideoEmbed } from './video-embed'

describe('toVideoEmbed', () => {
  it('converts a youtube.com watch URL to a no-cookie embed', () => {
    expect(toVideoEmbed('https://www.youtube.com/watch?v=abc123')).toEqual({
      kind: 'iframe',
      src: 'https://www.youtube-nocookie.com/embed/abc123',
    })
  })

  it('converts a youtu.be short URL to a no-cookie embed', () => {
    expect(toVideoEmbed('https://youtu.be/abc123')).toEqual({
      kind: 'iframe',
      src: 'https://www.youtube-nocookie.com/embed/abc123',
    })
  })

  it('converts a vimeo.com URL to a player embed', () => {
    expect(toVideoEmbed('https://vimeo.com/123456789')).toEqual({
      kind: 'iframe',
      src: 'https://player.vimeo.com/video/123456789',
    })
  })

  it('treats a direct video file URL as a file embed', () => {
    expect(toVideoEmbed('https://cdn.example.com/skills/muscle-up.mp4')).toEqual({
      kind: 'file',
      src: 'https://cdn.example.com/skills/muscle-up.mp4',
    })
  })

  it('returns null for an unparseable URL', () => {
    expect(toVideoEmbed('not a url')).toBeNull()
  })
})
