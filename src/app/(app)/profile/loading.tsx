import { SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors ProfilePage: identity card (avatar, name, stat row, XP bar),
// muscle-group XP bars, gym passport, and workout history below it.
export default function ProfileLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <SkeletonCard className="space-y-6">
        <div className="flex items-center gap-5">
          <SkeletonCircle className="h-16 w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-3.5 w-20" />
            <SkeletonBlock className="h-3.5 w-48" />
          </div>
        </div>
        <div className="space-y-1.5">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-2.5 w-full rounded-full" />
        </div>
      </SkeletonCard>

      <SkeletonCard className="space-y-4">
        <SkeletonBlock className="h-3.5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3.5 w-1/3" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        ))}
      </SkeletonCard>

      <SkeletonCard className="space-y-3">
        <SkeletonBlock className="h-3.5 w-32" />
        <SkeletonBlock className="h-20 w-full rounded-xl" />
        <SkeletonBlock className="h-20 w-full rounded-xl" />
      </SkeletonCard>
    </SkeletonPage>
  )
}
