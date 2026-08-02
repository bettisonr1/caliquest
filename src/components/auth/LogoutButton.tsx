'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    })
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        aria-label="Log out"
        className="h-10 w-10 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? 'Logging out…' : 'Log out'}
    </button>
  )
}
