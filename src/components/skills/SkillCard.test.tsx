import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SkillWithStatus } from '@/types/database'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const unlockSkillAction = vi.fn()
vi.mock('@/app/(app)/skills/actions', () => ({
  unlockSkillAction: (...args: unknown[]) => unlockSkillAction(...args),
}))

import { SkillCard } from './SkillCard'

function skill(overrides: Partial<SkillWithStatus> = {}): SkillWithStatus {
  return {
    id: 'skill-1',
    name: 'Muscle-up',
    description: null,
    muscle_group: 'pull',
    difficulty: 'advanced',
    required_mg_xp: 1000,
    sort_order: 1,
    form_cues: [],
    demo_video_url: null,
    status: 'locked',
    prerequisite_ids: [],
    user_mg_xp: 0,
    is_recorded: false,
    ...overrides,
  }
}

beforeEach(() => {
  unlockSkillAction.mockReset()
})

describe('SkillCard', () => {
  it('shows an xp progress bar for a locked skill', () => {
    render(<SkillCard skill={skill({ status: 'locked', user_mg_xp: 200, required_mg_xp: 1000 })} />)

    expect(screen.getByText('Muscle-up')).toBeInTheDocument()
    expect(screen.getByText('200 XP')).toBeInTheDocument()
    expect(screen.getByText('1,000 needed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unlock/i })).not.toBeInTheDocument()
  })

  it('shows an "Unlocked" label once recorded, with no unlock button', () => {
    render(<SkillCard skill={skill({ status: 'unlocked', is_recorded: true })} />)

    expect(screen.getByText('Unlocked')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unlock/i })).not.toBeInTheDocument()
  })

  it('offers an Unlock button once eligible but not yet recorded', () => {
    render(<SkillCard skill={skill({ status: 'unlocked', is_recorded: false })} />)

    expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument()
  })

  it('calls unlockSkillAction and refreshes the router on a successful unlock', async () => {
    const user = userEvent.setup()
    unlockSkillAction.mockResolvedValue({ ok: true })
    render(<SkillCard skill={skill({ status: 'unlocked', is_recorded: false })} />)

    await user.click(screen.getByRole('button', { name: /unlock/i }))

    expect(unlockSkillAction).toHaveBeenCalledWith('skill-1')
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('shows the error and re-enables the button when unlocking fails', async () => {
    const user = userEvent.setup()
    unlockSkillAction.mockResolvedValue({ ok: false, error: 'Not eligible yet.' })
    render(<SkillCard skill={skill({ status: 'unlocked', is_recorded: false })} />)

    await user.click(screen.getByRole('button', { name: /unlock/i }))

    expect(await screen.findByText('Not eligible yet.')).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /unlock/i })).not.toBeDisabled()
  })
})
