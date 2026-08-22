import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// `auth.getUser()` always makes a live network call to the Auth server to
// revalidate the JWT — it never reads a cache. On every navigation the
// shared (app) layout and the route's own page (often its actions too)
// each called it independently, meaning 2-3 redundant round trips to
// Supabase before a page's actual data queries even started. `cache()`
// dedupes calls with the same (no) arguments within a single request/render,
// so layout + page + server actions invoked during that render share one
// network call instead of one each. Middleware runs in a separate
// execution context and isn't covered by this cache.
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient()
  return supabase.auth.getUser()
})
