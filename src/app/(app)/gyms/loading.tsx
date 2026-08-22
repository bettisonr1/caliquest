import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors GymsExplorer: full-bleed map with an overlapping "bottom sheet"
// that starts collapsed to just its drag handle (the sheet's search bar
// and list only render once expanded, so there's nothing to skeleton
// there by default).
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

      <div className="relative -mt-5 mx-4 md:mx-0 rounded-t-2xl md:rounded-2xl md:mt-4 border border-gray-800 bg-gray-900 p-4 flex justify-center">
        <SkeletonBlock className="h-3 w-24" />
      </div>
    </SkeletonPage>
  )
}
