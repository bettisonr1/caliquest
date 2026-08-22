import { SkeletonBlock } from '@/components/loading/Skeleton'

// Mirrors GymsExplorer's two layouts — a near-full-height map with floating
// corner controls (recenter, search) and no persistent list, so there's
// nothing to skeleton besides the map itself and the floating mobile
// header bar (see AppShell's fullBleed handling for why mobile needs its
// own header skeleton here instead of the real one being visible).
export default function GymsLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="md:hidden fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <SkeletonBlock className="h-9 w-28 rounded-full" />
        <SkeletonBlock className="h-11 w-32 rounded-full" />
      </div>

      <div className="hidden md:flex mb-4 items-center justify-between gap-3">
        <SkeletonBlock className="h-7 w-16" />
        <SkeletonBlock className="h-9 w-20 rounded-lg" />
      </div>

      <SkeletonBlock className="fixed inset-x-0 top-0 z-10 bottom-[calc(4rem+env(safe-area-inset-bottom))] rounded-none md:relative md:inset-auto md:z-auto md:h-[70vh] md:rounded-2xl" />
    </div>
  )
}
