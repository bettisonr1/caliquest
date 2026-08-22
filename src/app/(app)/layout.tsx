import { AppShell } from '@/components/nav/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/services/notifications.service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const unreadCount = user ? await getUnreadCount(user.id) : 0

  return <AppShell unreadCount={unreadCount}>{children}</AppShell>
}
