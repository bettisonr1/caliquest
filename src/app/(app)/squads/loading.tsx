import { SkeletonBlock, SkeletonCard, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors SquadsPage: title, "my squads" list card, then the create-squad form.
export default function SquadsLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-24" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-24" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBlock className="h-3.5 w-2/5" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-4 w-4 shrink-0" />
          </div>
        ))}
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </SkeletonCard>
    </SkeletonPage>
  )
}
