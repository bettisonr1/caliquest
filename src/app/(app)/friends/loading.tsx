import { SkeletonBlock, SkeletonCard, SkeletonPage, SkeletonRow } from '@/components/loading/Skeleton'

// Mirrors FriendsPage: title, the add-friend input, and the friends list card.
export default function FriendsLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-24" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>

      <SkeletonCard>
        <SkeletonBlock className="h-11 w-full rounded-lg" />
      </SkeletonCard>

      <SkeletonCard className="space-y-4">
        <SkeletonBlock className="h-3.5 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </SkeletonCard>
    </SkeletonPage>
  )
}
