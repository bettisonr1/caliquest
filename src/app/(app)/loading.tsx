import { SkeletonBlock, SkeletonCard, SkeletonPage } from '@/components/loading/Skeleton'

// Generic fallback shown while a page under the (app) shell fetches its
// data, for any route that doesn't (yet) have its own loading.tsx. The
// header and bottom nav stay mounted (they live outside this Suspense
// boundary in layout.tsx); only the content area below swaps to this.
//
// Prefer adding a page-specific loading.tsx next to page.tsx instead of
// relying on this — see CLAUDE.md's "Custom loading screens" section.
export default function AppLoading() {
  return (
    <SkeletonPage>
      <SkeletonBlock className="h-6 w-1/3" />
      <SkeletonCard className="h-24" />
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
      <SkeletonCard className="h-32" />
    </SkeletonPage>
  )
}
