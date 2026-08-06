'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { moreNavItems } from '@/components/nav/nav-items'

export function MoreNavMenu({ variant }: { variant: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false)

  const menu = (
    <div
      className={`absolute ${variant === 'mobile' ? 'bottom-full right-0 mb-2' : 'left-0 mt-2'} w-48 rounded-2xl border border-gray-800 bg-gray-900 shadow-xl z-40 p-2`}
    >
      {moreNavItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  )

  if (variant === 'mobile') {
    return (
      <div className="relative flex-1 min-w-0">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label="More"
          className="w-full flex flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-emerald-400 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px]">More</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            {menu}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        More
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          {menu}
        </>
      )}
    </div>
  )
}
