import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllSkills, getSkillPrerequisites } from '@/lib/repositories/skills.repository'
import { getProfile } from '@/lib/repositories/profiles.repository'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)
  if (profile.onboarded_at) redirect('/dashboard')

  const [skills, prerequisites] = await Promise.all([
    getAllSkills(supabase),
    getSkillPrerequisites(supabase),
  ])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <OnboardingFlow
        skills={skills}
        prerequisites={prerequisites}
        username={profile.username}
      />
    </div>
  )
}
