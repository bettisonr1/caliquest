import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { GymsExplorer } from '@/components/gyms/GymsExplorer'

export default async function GymsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  return <GymsExplorer />
}
