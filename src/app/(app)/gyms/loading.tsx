import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors GymsExplorer: full-bleed map with an overlapping "bottom sheet"
// holding the search bar and the nearby-gyms list.
export default function GymsLoading() {
  return (
    <SkeletonPage className="space-y-0">
      <div className="flex items-center justify-between gap-3 mb-4">
        <SkeletonBlock className="h-7 w-16" />
        <SkeletonBlock className="h-9 w-20 rounded-lg" />
      </div>

      <div className="-mx-4 md:mx-0">
        <SkeletonBlock className="h-[45vh] md:h-[55vh] md:rounded-2xl rounded-none" />
      </div>

      <div className="relative -mt-5 mx-4 md:mx-0 rounded-t-2xl md:rounded-2xl md:mt-4 border border-gray-800 bg-gray-900 p-4 space-y-3">
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <SkeletonBlock className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonBlock className="h-3.5 w-2/5" />
                <SkeletonBlock className="h-3 w-1/4" />
              </div>
            </div>
            <SkeletonBlock className="h-3 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  )
}
