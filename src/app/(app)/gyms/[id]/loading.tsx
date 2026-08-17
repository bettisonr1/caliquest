import { SkeletonBlock, SkeletonCard, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors GymDetailPage: back link, the gym header card (name, badges,
// equipment chips, directions button), then the competitions, leaderboard
// and reviews cards below it.
export default function GymDetailLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <SkeletonBlock className="h-4 w-16" />

      <SkeletonCard className="space-y-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-2/3" />
          <SkeletonBlock className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-6 w-24 rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="h-11 w-full rounded-lg" />
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-40" />
        <SkeletonBlock className="h-14 w-full rounded-xl" />
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3.5 w-1/3" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        ))}
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-24" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
      </SkeletonCard>
    </SkeletonPage>
  )
}
