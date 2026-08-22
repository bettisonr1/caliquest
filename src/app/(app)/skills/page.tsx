import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { SkillsTree } from '@/components/skills/SkillsTree'
import { getSkillsWithStatus } from '@/lib/services/skills.service'

export default async function SkillsPage() {
  const { data: { user } } = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const { skills, mgXp } = await getSkillsWithStatus(user.id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Skills Tree</h1>
        <p className="text-gray-400 text-sm mt-1">
          Unlock new movements as you earn XP in each muscle group.
        </p>
      </div>
      <SkillsTree skills={skills} mgXp={mgXp} />
    </div>
  )
}
