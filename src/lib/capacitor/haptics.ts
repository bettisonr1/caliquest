// Thin wrapper around @capacitor/haptics for the primary/"More" nav taps.
//
// @capacitor/haptics ships a web implementation (navigator.vibrate, itself a
// no-op on browsers/devices without vibration support), so this is safe to
// call unconditionally from any client component — no isNativePlatform()
// guard needed, unlike @capacitor/status-bar. Dynamically imported so the
// plugin (and Capacitor's native bridge shim) never lands in the initial
// bundle for a tap that may never happen.
export function triggerNavHaptic() {
  import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
    .catch(() => {
      // Best-effort tactile polish only — never let it break navigation.
    })
}
