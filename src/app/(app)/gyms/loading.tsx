import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors GymsExplorer's two layouts:
// - Mobile: full-screen map (fixed, edge-to-edge up to the bottom nav) with
//   a floating top bar and a bottom sheet holding the search bar + list.
// - Desktop: in-flow title row, map card, then list card below it.
export default function GymsLoading() {
  return (
    <>
      <div className="md:hidden fixed inset-0 z-10 animate-pulse bg-gray-900" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <SkeletonBlock className="h-9 w-28 rounded-full bg-gray-800/80" />
          <SkeletonBlock className="h-11 w-32 rounded-full bg-gray-800/80" />
        </div>

        <div className="absolute inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] mb-3 max-h-[50vh] rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-3">
          <div className="flex justify-center -mt-1 -mx-4 mb-1">
            <SkeletonBlock className="h-1 w-10 rounded-full" />
          </div>
          <SkeletonBlock className="h-11 w-full rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
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
      </div>

      <SkeletonPage className="hidden md:block space-y-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-9 w-20 rounded-lg" />
        </div>

        <SkeletonBlock className="h-[55vh] rounded-2xl" />

        <div className="relative mt-4 rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-3">
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
    </>
  )
}
