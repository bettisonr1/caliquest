import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors SkillsTree: title, then the horizontally-scrolling muscle-group
// columns of skill cards (same edge-bleed pattern as the real tree).
export default function SkillsLoading() {
  return (
    <SkeletonPage>
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="h-4 w-56" />
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-4 min-w-max">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="w-56 shrink-0">
              <div className="mb-4 pb-2 border-b border-gray-800 space-y-1.5">
                <SkeletonBlock className="h-3.5 w-16" />
                <SkeletonBlock className="h-3 w-12" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, row) => (
                  <SkeletonBlock key={row} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  )
}
