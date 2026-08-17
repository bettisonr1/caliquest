import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors CompetitionsExplorer: title + add button, search bar, the
// near-you/mine tab switch, and the list of competition cards.
export default function CompetitionsLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-20 rounded-lg shrink-0" />
      </div>

      <SkeletonBlock className="h-11 w-full rounded-lg" />
      <SkeletonBlock className="h-10 w-full rounded-lg" />

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800">
            <SkeletonBlock className="h-14 w-14 rounded-lg shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBlock className="h-3.5 w-2/3" />
              <SkeletonBlock className="h-3 w-1/2" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonPage>
  )
}
