import { SkeletonBlock, SkeletonCard, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors WorkoutBuilder's layout: title, then the exercise-picker aside
// (filter chips + exercise list) beside the current-workout entries area.
export default function WorkoutLoading() {
  return (
    <SkeletonPage>
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-full" />
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <SkeletonCard className="space-y-3">
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard className="space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-24 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-full rounded-lg" />
        </SkeletonCard>
      </div>
    </SkeletonPage>
  )
}
