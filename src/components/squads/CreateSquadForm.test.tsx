import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const createSquadAction = vi.fn()
vi.mock('@/app/(app)/squads/actions', () => ({
  createSquadAction: (...args: unknown[]) => createSquadAction(...args),
}))

import { CreateSquadForm } from './CreateSquadForm'

beforeEach(() => {
  createSquadAction.mockReset()
  push.mockReset()
})

describe('CreateSquadForm', () => {
  it('starts collapsed behind a "Start a squad" button', () => {
    render(<CreateSquadForm />)

    expect(screen.getByRole('button', { name: /start a squad/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Squad name')).not.toBeInTheDocument()
  })

  it('expands the form on click, and disables submit until a name is entered', async () => {
    const user = userEvent.setup()
    render(<CreateSquadForm />)

    await user.click(screen.getByRole('button', { name: /start a squad/i }))

    expect(screen.getByRole('button', { name: /create squad/i })).toBeDisabled()
    await user.type(screen.getByPlaceholderText('Squad name'), 'Bar Crew')
    expect(screen.getByRole('button', { name: /create squad/i })).toBeEnabled()
  })

  it('submits the entered fields and navigates to the new squad on success', async () => {
    const user = userEvent.setup()
    createSquadAction.mockResolvedValue({ ok: true, squadId: 'squad-1' })
    render(<CreateSquadForm />)

    await user.click(screen.getByRole('button', { name: /start a squad/i }))
    await user.type(screen.getByPlaceholderText('Squad name'), 'Bar Crew')
    await user.type(screen.getByPlaceholderText('Gym or spot (optional)'), 'Muscle Beach')
    await user.click(screen.getByRole('button', { name: /create squad/i }))

    expect(createSquadAction).toHaveBeenCalledWith({
      name: 'Bar Crew',
      gym_name: 'Muscle Beach',
      meeting_info: '',
    })
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/squads/squad-1'))
  })

  it('shows the server error and stays open on failure', async () => {
    const user = userEvent.setup()
    createSquadAction.mockResolvedValue({ ok: false, error: 'Give your squad a name.' })
    render(<CreateSquadForm />)

    await user.click(screen.getByRole('button', { name: /start a squad/i }))
    await user.type(screen.getByPlaceholderText('Squad name'), 'x')
    await user.click(screen.getByRole('button', { name: /create squad/i }))

    expect(await screen.findByText('Give your squad a name.')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('collapses back on Cancel', async () => {
    const user = userEvent.setup()
    render(<CreateSquadForm />)

    await user.click(screen.getByRole('button', { name: /start a squad/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByRole('button', { name: /start a squad/i })).toBeInTheDocument()
  })
})
