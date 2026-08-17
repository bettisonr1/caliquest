import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const unlockSkillAction = vi.fn()
vi.mock('@/app/(app)/skills/actions', () => ({
  unlockSkillAction: (...args: unknown[]) => unlockSkillAction(...args),
}))

import { SkillUnlockButton } from './SkillUnlockButton'

beforeEach(() => {
  unlockSkillAction.mockReset()
})

describe('SkillUnlockButton', () => {
  it('calls unlockSkillAction with the skill id and refreshes on success', async () => {
    const user = userEvent.setup()
    unlockSkillAction.mockResolvedValue({ ok: true })
    render(<SkillUnlockButton skillId="skill-1" />)

    await user.click(screen.getByRole('button', { name: /unlock/i }))

    expect(unlockSkillAction).toHaveBeenCalledWith('skill-1')
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('shows the error and re-enables the button when unlocking fails', async () => {
    const user = userEvent.setup()
    unlockSkillAction.mockResolvedValue({ ok: false, error: 'Not eligible yet.' })
    render(<SkillUnlockButton skillId="skill-1" />)

    await user.click(screen.getByRole('button', { name: /unlock/i }))

    expect(await screen.findByText('Not eligible yet.')).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /unlock/i })).not.toBeDisabled()
  })

  it('disables the button while the unlock is in flight', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: { ok: true }) => void = () => {}
    unlockSkillAction.mockReturnValue(new Promise(resolve => { resolvePromise = resolve }))
    render(<SkillUnlockButton skillId="skill-1" />)

    await user.click(screen.getByRole('button', { name: /unlock/i }))
    expect(screen.getByRole('button', { name: /unlocking/i })).toBeDisabled()

    resolvePromise({ ok: true })
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })
})
