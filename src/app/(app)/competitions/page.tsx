import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompetitionsExplorer } from '@/components/competitions/CompetitionsExplorer'

export default async function CompetitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <CompetitionsExplorer />
}
