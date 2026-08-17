import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors AddGymForm: title, the pin-drop map, then name + equipment fields.
export default function AddGymLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="h-4 w-full" />
      </div>

      <div className="-mx-4 md:mx-0">
        <SkeletonBlock className="h-[35vh] md:rounded-2xl rounded-none" />
      </div>

      <div className="space-y-3">
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>
        <SkeletonBlock className="h-12 w-full rounded-lg" />
      </div>
    </SkeletonPage>
  )
}
