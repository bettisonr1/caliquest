import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { GymsExplorer } from '@/components/gyms/GymsExplorer'
import { getUnreadCount } from '@/lib/services/notifications.service'

export default async function GymsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  // The app header (and its NotificationBell) is hidden on mobile for this
  // route — see AppShell — so GymsExplorer renders its own copy in a
  // floating top bar over the full-screen map.
  const unreadCount = await getUnreadCount(user.id)

  return <GymsExplorer unreadCount={unreadCount} />
}
