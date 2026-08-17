import { SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors FriendProfilePage: back link, identity card, then workout history.
export default function FriendProfileLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <SkeletonBlock className="h-4 w-16" />

      <SkeletonCard>
        <div className="flex items-center gap-5">
          <SkeletonCircle className="h-16 w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-3.5 w-20" />
            <SkeletonBlock className="h-3.5 w-48" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-32" />
        <SkeletonBlock className="h-20 w-full rounded-xl" />
        <SkeletonBlock className="h-20 w-full rounded-xl" />
      </SkeletonCard>
    </SkeletonPage>
  )
}
