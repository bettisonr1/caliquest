import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGymById } from '@/lib/repositories/gyms.repository'
import { CompetitionForm } from '@/components/competitions/CompetitionForm'

export default async function AddCompetitionPage({
  searchParams,
}: {
  searchParams: Promise<{ gymId?: string }>
}) {
  const { gymId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Arriving from a gym's "Add competition" CTA pre-fills and locks the
  // gym field — fetched fresh here rather than trusting the query string's
  // name, in case it's stale.
  const initialGym = gymId ? await getGymById(supabase, gymId) : null

  return <CompetitionForm initialGym={initialGym ? { id: initialGym.id, name: initialGym.name } : null} />
}
