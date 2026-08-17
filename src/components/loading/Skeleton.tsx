// Shared building blocks for per-page loading.tsx skeletons (see
// src/app/(app)/*/loading.tsx). Keeping these in one place means every
// skeleton uses the same pulse timing and shade, so switching nav tabs
// doesn't jitter between slightly different grays.
//
// Compose these into a shape that echoes the page's actual layout (same
// cards, same list rows, same grid) rather than a generic spinner — see
// CLAUDE.md's "Custom loading screens" section for the rule that these
// must be kept in sync with their page.

import type { ReactNode } from 'react'

export function SkeletonPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`animate-pulse space-y-6 ${className}`} aria-hidden="true">
      {children}
    </div>
  )
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-gray-800 ${className}`} />
}

export function SkeletonCircle({ className = '' }: { className?: string }) {
  return <div className={`shrink-0 rounded-full bg-gray-800 ${className}`} />
}

export function SkeletonCard({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-800 bg-gray-900 p-5 ${className}`}>
      {children}
    </div>
  )
}

// A row shaped like an avatar + two lines of text + trailing bit — the most
// common list-item pattern across friends/squads/leaderboard/passport lists.
export function SkeletonRow({ trailing = true }: { trailing?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <SkeletonCircle className="h-10 w-10" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock className="h-3.5 w-2/5" />
        <SkeletonBlock className="h-3 w-1/4" />
      </div>
      {trailing && <SkeletonBlock className="h-4 w-4 shrink-0" />}
    </div>
  )
}
