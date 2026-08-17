import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

let mockPathname = '/dashboard'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

import { MoreNavMenu } from './MoreNavMenu'

describe('MoreNavMenu', () => {
  it('highlights the trigger when the active route is inside the menu', () => {
    mockPathname = '/squads'
    render(<MoreNavMenu variant="mobile" />)

    expect(screen.getByRole('button', { name: /more/i })).toHaveClass('text-emerald-400')
  })

  it('does not highlight the trigger when the active route is outside the menu', () => {
    mockPathname = '/dashboard'
    render(<MoreNavMenu variant="mobile" />)

    expect(screen.getByRole('button', { name: /more/i })).not.toHaveClass('text-emerald-400')
  })

  it('marks the active item inside the open menu', async () => {
    mockPathname = '/squads'
    const user = userEvent.setup()
    render(<MoreNavMenu variant="mobile" />)

    await user.click(screen.getByRole('button', { name: /more/i }))

    expect(screen.getByRole('link', { name: /squads/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /profile/i })).not.toHaveAttribute('aria-current')
  })
})
