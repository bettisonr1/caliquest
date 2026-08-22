import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { AddGymForm } from '@/components/gyms/AddGymForm'

export default async function AddGymPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  return <AddGymForm />
}
