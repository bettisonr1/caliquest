import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CaliQuest',
  description: 'Gamified calisthenics — level up your body',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
