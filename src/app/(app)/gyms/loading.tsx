import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors GymsExplorer: a near-full-height map with floating corner
// controls (recenter, search) and no persistent list — nothing to
// skeleton below the map besides the attribution line.
export default function GymsLoading() {
  return (
    <SkeletonPage className="space-y-0">
      <div className="flex items-center justify-between gap-3 mb-4">
        <SkeletonBlock className="h-7 w-16" />
        <SkeletonBlock className="h-9 w-20 rounded-lg" />
      </div>

      <div className="-mx-4 md:mx-0">
        <SkeletonBlock className="h-[70vh] md:h-[72vh] md:rounded-2xl rounded-none" />
      </div>

      <div className="mt-3 flex justify-center">
        <SkeletonBlock className="h-3 w-40" />
      </div>
    </SkeletonPage>
  )
}
