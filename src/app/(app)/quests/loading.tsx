import { SkeletonBlock, SkeletonCard, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors QuestsPage/QuestBoard: title, the active/offered quest card (with
// its progress bar and guru chat), then past-quest history rows.
export default function QuestsLoading() {
  return (
    <SkeletonPage className="max-w-2xl">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-full" />
      </div>

      <SkeletonCard className="space-y-4">
        <SkeletonBlock className="h-3 w-28" />
        <div className="flex items-start justify-between gap-3">
          <SkeletonBlock className="h-5 w-2/3" />
          <SkeletonBlock className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
        <SkeletonBlock className="h-24 w-full rounded-xl" />
      </SkeletonCard>

      <div className="space-y-3">
        <SkeletonBlock className="h-3.5 w-24" />
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  )
}
