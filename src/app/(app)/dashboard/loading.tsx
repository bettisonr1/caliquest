import { SkeletonBlock, SkeletonCard, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors DashboardPage: greeting + level line with a "Log workout" button,
// the 5-tile "Last 7 days" stat strip, and the workout-history link card.
export default function DashboardLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-lg" />
      </div>

      <div>
        <SkeletonBlock className="h-3 w-24 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="p-4 space-y-2">
              <SkeletonBlock className="h-4 w-4" />
              <SkeletonBlock className="h-6 w-10" />
              <SkeletonBlock className="h-3 w-14" />
            </SkeletonCard>
          ))}
        </div>
      </div>

      <SkeletonCard className="flex items-center gap-3">
        <SkeletonBlock className="h-5 w-5" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <SkeletonBlock className="h-3.5 w-32" />
          <SkeletonBlock className="h-3 w-48" />
        </div>
      </SkeletonCard>
    </SkeletonPage>
  )
}
