import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { CompetitionsExplorer } from '@/components/competitions/CompetitionsExplorer'

export default async function CompetitionsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  return <CompetitionsExplorer />
}
