import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddGymForm } from '@/components/gyms/AddGymForm'

export default async function AddGymPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <AddGymForm />
}
