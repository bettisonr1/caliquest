import { toVideoEmbed } from '@/lib/video-embed'

export function SkillDemoVideo({ url, skillName }: { url: string; skillName: string }) {
  const embed = toVideoEmbed(url)
  if (!embed) return null

  if (embed.kind === 'iframe') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          src={embed.src}
          title={`${skillName} demo`}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <video
      src={embed.src}
      controls
      playsInline
      preload="metadata"
      className="w-full rounded-xl bg-black"
    >
      <track kind="captions" />
    </video>
  )
}
