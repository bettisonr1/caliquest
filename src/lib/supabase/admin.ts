import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely. Server-only: never import this
// from a client component, and never expose SUPABASE_SERVICE_ROLE_KEY via a
// NEXT_PUBLIC_* variable. Used for operations an ordinary user session can't
// perform, e.g. deleting an auth.users row for account deletion (see
// src/lib/services/account.service.ts) via the Supabase Admin API.
//
// Same env var already used by scripts/import-osm-gyms.ts for its own
// RLS-bypassing writes — set SUPABASE_SERVICE_ROLE_KEY in .env.local for dev
// and as a server-side (non-public) environment variable in Amplify Hosting.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
