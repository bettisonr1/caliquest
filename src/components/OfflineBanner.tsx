'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

// Gym wifi drops mid-session more than home/office wifi does. Once the app
// has loaded, a dropped connection otherwise fails silently — a server
// action just hangs or rejects with no explanation. This surfaces it
// explicitly instead. Mounted globally (root layout) so it covers
// signed-out pages too, not just the authenticated app shell.
//
// This only covers "loaded, then went offline" — it can't help the native
// wrapper's *first* load (Guideline-driven Capacitor build points at the
// live URL, so a cold start with no network hits a raw WKWebView error
// page before any of this JS runs). See APP_STORE_DEPLOYMENT.md §4/§5 —
// that half needs a Capacitor-level fallback (e.g. a bundled local error
// page), added when the native wrapper itself is built.
export function OfflineBanner() {
  // Always start "online" so the server render and the client's first
  // render agree (Node 21+ exposes a global `navigator`, but without
  // `onLine`, so branching on it in the initializer diverges from the
  // browser and breaks hydration). The effect below corrects this
  // immediately after mount, before the user can notice.
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-gray-950 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      You&apos;re offline — some actions won&apos;t work until you&apos;re back on wifi.
    </div>
  )
}
