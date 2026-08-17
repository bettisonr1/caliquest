import { SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors CompetitionDetailPage: back link, the image + details card with
// register buttons, then the competing/attending participant lists.
export default function CompetitionDetailLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <SkeletonBlock className="h-4 w-24" />

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <SkeletonBlock className="h-48 w-full rounded-none" />
        <div className="p-6 space-y-3">
          <SkeletonBlock className="h-7 w-2/3" />
          <SkeletonBlock className="h-3.5 w-1/2" />
          <SkeletonBlock className="h-3.5 w-2/5" />
          <SkeletonBlock className="h-3.5 w-3/5" />
          <SkeletonBlock className="h-11 w-full rounded-lg mt-4" />
        </div>
      </div>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <SkeletonCircle className="h-7 w-7" />
            <SkeletonBlock className="h-3.5 w-32" />
          </div>
        ))}
      </SkeletonCard>
    </SkeletonPage>
  )
}
