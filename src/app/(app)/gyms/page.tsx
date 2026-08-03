import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GymsExplorer } from '@/components/gyms/GymsExplorer'

export default async function GymsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <GymsExplorer />
}
