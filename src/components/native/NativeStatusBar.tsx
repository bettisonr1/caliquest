'use client'

import { useEffect } from 'react'

// Matches the native iOS status bar to the app's dark chrome so there's no
// visual seam at the notch/Dynamic Island — see
// docs/APP_STORE_DEPLOYMENT.md §5.4/§9 ("Status bar styled to match app
// chrome", previously unchecked).
//
// The same JS bundle is served to both the browser (Amplify) and the
// Capacitor WKWebView (capacitor.config.ts points at the live URL), and
// @capacitor/status-bar has no web implementation — calling it outside a
// native shell throws. So every call here is gated behind
// Capacitor.isNativePlatform(), and both plugins are dynamically imported
// to keep them out of the web bundle entirely.
export function NativeStatusBar() {
  useEffect(() => {
    let cancelled = false

    async function configure() {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform() || cancelled) return

      const { StatusBar, Style } = await import('@capacitor/status-bar')
      // The app already pads its header/nav with env(safe-area-inset-*), so
      // let the WebView draw full-bleed under the status bar instead of
      // Capacitor reserving a separate solid bar behind it — two different
      // surfaces there is exactly the "wrapped website" look Apple's
      // Guideline 4.2 review flags.
      await StatusBar.setOverlaysWebView({ overlay: true })
      // Style.Dark = light status bar content, which is what a dark
      // background needs (the enum names the bar's companion background,
      // not the content color it produces). The app is dark-themed
      // everywhere, so this doesn't need to track system light/dark mode.
      await StatusBar.setStyle({ style: Style.Dark })
    }

    configure().catch(() => {
      // Best-effort native polish — never block rendering the web app on it.
    })

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
