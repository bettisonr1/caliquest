import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockPathname = '/dashboard'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

import { DesktopPrimaryNav, MobilePrimaryNav, isNavItemActive } from './PrimaryNav'

describe('isNavItemActive', () => {
  it('matches the exact path', () => {
    expect(isNavItemActive('/workout', '/workout')).toBe(true)
  })

  it('matches nested paths', () => {
    expect(isNavItemActive('/workout/123', '/workout')).toBe(true)
  })

  it('does not match a different top-level route', () => {
    expect(isNavItemActive('/workouts', '/workout')).toBe(false)
  })

  it('does not match an unrelated route', () => {
    expect(isNavItemActive('/skills', '/workout')).toBe(false)
  })
})

describe('DesktopPrimaryNav', () => {
  it('marks the current route as the active page', () => {
    mockPathname = '/skills'
    render(<DesktopPrimaryNav />)

    const active = screen.getByRole('link', { name: /skills/i })
    expect(active).toHaveAttribute('aria-current', 'page')

    const inactive = screen.getByRole('link', { name: /dashboard/i })
    expect(inactive).not.toHaveAttribute('aria-current')
  })
})

describe('MobilePrimaryNav', () => {
  it('marks the current route as the active page', () => {
    mockPathname = '/quests'
    render(<MobilePrimaryNav />)

    const active = screen.getByRole('link', { name: /quests/i })
    expect(active).toHaveAttribute('aria-current', 'page')

    const inactive = screen.getByRole('link', { name: /home/i })
    expect(inactive).not.toHaveAttribute('aria-current')
  })
})
