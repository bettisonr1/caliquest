import { SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors SquadWall: the squad details card, member avatars row, then the
// post feed with its composer.
export default function SquadWallLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <SkeletonCard className="space-y-2">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-3.5 w-56" />
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-24" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCircle key={i} className="h-9 w-9" />
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="space-y-4">
        <SkeletonBlock className="h-16 w-full rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <SkeletonCircle className="h-8 w-8" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-3.5 w-full" />
              <SkeletonBlock className="h-3.5 w-2/3" />
            </div>
          </div>
        ))}
      </SkeletonCard>
    </SkeletonPage>
  )
}
