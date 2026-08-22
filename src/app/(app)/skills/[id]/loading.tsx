import { SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors the skill detail page: back link, header card (badges, title,
// description, status, XP bar), demo video, form cues, exercises, then the
// prerequisite/unlock chains.
export default function SkillDetailLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <SkeletonBlock className="h-4 w-16" />

      <SkeletonCard className="space-y-3">
        <div className="flex gap-2">
          <SkeletonBlock className="h-5 w-20 rounded-full" />
          <SkeletonBlock className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonBlock className="h-7 w-2/3" />
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-4/5" />
        <SkeletonBlock className="h-2.5 w-24" />
      </SkeletonCard>

      <SkeletonBlock className="aspect-video w-full rounded-xl" />

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <SkeletonCircle className="h-4 w-4 mt-0.5" />
            <SkeletonBlock className="h-3.5 flex-1" />
          </div>
        ))}
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3 w-24" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3.5 w-1/2" />
            <SkeletonBlock className="h-4 w-8 rounded-full" />
          </div>
        ))}
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3 w-28" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonCircle className="h-3.5 w-3.5" />
            <SkeletonBlock className="h-3.5 w-2/5" />
          </div>
        ))}
      </SkeletonCard>
    </SkeletonPage>
  )
}
