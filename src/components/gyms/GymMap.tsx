'use client'

import dynamic from 'next/dynamic'

// MapLibre touches the DOM/canvas directly and has no useful server render,
// so it's lazy-loaded client-only — same pattern as FlexAvatar/three.js.
export const GymMap = dynamic(() => import('./GymMapInner').then(m => m.GymMapInner), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-900 text-sm text-gray-500">
      Loading map…
    </div>
  ),
})
