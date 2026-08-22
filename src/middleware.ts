import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Set once onboarding completes (middleware, on first read after the DB
// confirms it; also set eagerly by completeOnboardingAction). Lets
// middleware skip the `profiles.onboarded_at` DB round trip that would
// otherwise run on every single navigation for every already-onboarded
// user. Not a security boundary — just a UX redirect gate — so a stale
// cookie is a non-issue; source of truth stays `profiles.onboarded_at`.
const ONBOARDED_COOKIE = 'cq_onboarded'
const ONBOARDED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  // Public regardless of auth state — /privacy is the URL that goes in App
  // Store Connect (Guideline 5.1.1), so it must load for a signed-out
  // reviewer too.
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/privacy')

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // First-login placement: send new users to /onboarding until they complete
  // it, and keep onboarded users out of it. /auth/* (OAuth callback) and the
  // landing page are left alone.
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')
  if (user && !isAuthCallback && !isPublicRoute) {
    let onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === '1'

    if (!onboarded) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarded_at')
        .eq('user_id', user.id)
        .maybeSingle()
      // Fail open: if the status can't be read (e.g. schema migration not yet
      // applied), don't trap the whole app behind /onboarding.
      if (error) return supabaseResponse
      onboarded = Boolean(profile?.onboarded_at)
      if (onboarded) {
        supabaseResponse.cookies.set(ONBOARDED_COOKIE, '1', {
          path: '/',
          maxAge: ONBOARDED_COOKIE_MAX_AGE,
          sameSite: 'lax',
        })
      }
    }

    if (!onboarded && !isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
    if (onboarded && isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
