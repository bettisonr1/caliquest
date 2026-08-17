// Shown instantly while a page under the (app) shell fetches its data, so
// switching nav tabs gives immediate feedback instead of appearing frozen.
// The header and bottom nav stay mounted (they live outside this Suspense
// boundary in layout.tsx); only the content area below swaps to this skeleton.
export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-6 w-1/3 rounded bg-gray-800" />
      <div className="h-24 rounded-xl bg-gray-800" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-800" />
        <div className="h-4 w-5/6 rounded bg-gray-800" />
        <div className="h-4 w-2/3 rounded bg-gray-800" />
      </div>
      <div className="h-32 rounded-xl bg-gray-800" />
    </div>
  )
}
