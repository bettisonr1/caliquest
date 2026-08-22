'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { moreNavItems } from '@/components/nav/nav-items'
import { isNavItemActive } from '@/components/nav/PrimaryNav'
import { triggerNavHaptic } from '@/lib/capacitor/haptics'

export function MoreNavMenu({ variant }: { variant: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const activeItem = moreNavItems.find(({ href }) => isNavItemActive(pathname, href))

  if (variant === 'mobile') {
    return <MobileMoreSheet open={open} setOpen={setOpen} activeItem={activeItem} />
  }

  const menu = (
    <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-gray-800 bg-gray-900 shadow-xl z-40 p-2">
      {moreNavItems.map(({ href, label, icon: Icon }) => {
        const active = href === activeItem?.href
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          activeItem ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
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

type MoreItem = (typeof moreNavItems)[number]

// The mobile "More" tab used to open a small dropdown card pinned to the
// corner above the trigger — a web popover pattern, not something iOS users
// would recognize. This instead renders the standard iOS action-sheet
// shape: a modal that rises from the bottom, a rounded/blurred grouped list
// of destinations, and a separate "Close" row below it (mirroring
// UIAlertController's actionSheet style, which always sets its Cancel
// button apart from the main option group).
function MobileMoreSheet({
  open,
  setOpen,
  activeItem,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  activeItem: MoreItem | undefined
}) {
  // Two-phase mount so the panel/backdrop actually transition in (render
  // off-screen/transparent first, then flip to the resting position a
  // frame later) instead of just appearing.
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(open))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    // Native sheets suspend the page underneath — keep the app shell from
    // scrolling behind the modal while it's up.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  function openSheet() {
    triggerNavHaptic()
    setOpen(true)
  }

  return (
    <div className="relative flex-1 min-w-0">
      <button
        onClick={() => (open ? setOpen(false) : openSheet())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="More"
        className={`w-full flex flex-col items-center gap-0.5 py-2 transition-colors active:scale-95 ${
          activeItem ? 'text-emerald-400' : 'text-gray-500 hover:text-emerald-400'
        }`}
      >
        <MoreHorizontal className={`h-5 w-5 transition-transform ${activeItem ? 'scale-110' : ''}`} />
        <span className="text-[10px]">More</span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="More menu" className="fixed inset-0 z-40">
          <div
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${
              entered ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            className={`absolute inset-x-0 bottom-0 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] transition-transform duration-200 ease-out ${
              entered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-2 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-xl">
                {moreNavItems.map(({ href, label, icon: Icon }) => {
                  const active = href === activeItem?.href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => {
                        triggerNavHaptic()
                        setOpen(false)
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 px-4 py-3.5 text-[15px] transition-colors active:bg-white/10 ${
                        active ? 'text-emerald-400' : 'text-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {label}
                    </Link>
                  )
                })}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-2xl border border-white/10 bg-gray-900/95 py-3.5 text-[15px] font-semibold text-emerald-400 shadow-2xl backdrop-blur-xl active:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
