import { SkeletonBlock, SkeletonPage } from '@/components/loading/Skeleton'

// Mirrors CompetitionForm: image picker, name/description fields, date
// fields, and the skill-level / capacity / fee row.
export default function AddCompetitionLoading() {
  return (
    <SkeletonPage className="max-w-2xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-full" />
      </div>

      <SkeletonBlock className="h-40 w-full rounded-xl" />
      <SkeletonBlock className="h-11 w-full rounded-lg" />
      <SkeletonBlock className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <SkeletonBlock className="h-11 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-11 w-full rounded-lg" />
        <SkeletonBlock className="h-11 w-full rounded-lg" />
      </div>
      <SkeletonBlock className="h-12 w-32 rounded-lg" />
    </SkeletonPage>
  )
}
