import type { Metadata, Viewport } from 'next'
import { OfflineBanner } from '@/components/OfflineBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'CaliQuest',
  description: 'Gamified calisthenics — level up your body',
  appleWebApp: {
    capable: true,
    title: 'CaliQuest',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Draw edge-to-edge on notched phones; layouts pad with
  // env(safe-area-inset-*) where needed.
  viewportFit: 'cover',
  themeColor: '#030712', // gray-950, matches the app chrome
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* bg on body so overscroll never flashes white on mobile */}
      <body className="antialiased bg-gray-950 text-gray-100">
        <OfflineBanner />
        {children}
      </body>
    </html>
  )
}
