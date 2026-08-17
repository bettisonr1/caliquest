// Turns a stored demo_video_url into something the skill detail page can
// render: a YouTube/Vimeo watch link becomes an iframe embed src, anything
// else (an .mp4/.webm URL) is played directly with <video>.

export type VideoEmbed =
  | { kind: 'iframe'; src: string }
  | { kind: 'file'; src: string }

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com'])

export function toVideoEmbed(url: string): VideoEmbed | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (YOUTUBE_HOSTS.has(parsed.hostname)) {
    const id = parsed.hostname === 'youtu.be'
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop()
    if (!id) return null
    return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` }
  }

  if (VIMEO_HOSTS.has(parsed.hostname)) {
    const id = parsed.pathname.split('/').filter(Boolean).pop()
    if (!id) return null
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` }
  }

  return { kind: 'file', src: url }
}
