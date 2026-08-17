import { SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors LeaderboardPage: title, the week/month period toggle, and the
// ranked friends list.
export default function LeaderboardLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-56" />
      </div>

      <SkeletonBlock className="h-10 w-40 rounded-lg" />

      <SkeletonCard>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-3 w-4" />
              <SkeletonCircle className="h-8 w-8" />
              <SkeletonBlock className="h-3.5 flex-1" />
              <SkeletonBlock className="h-3 w-14 shrink-0" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </SkeletonPage>
  )
}
