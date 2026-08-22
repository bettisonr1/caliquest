import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NearbyGym } from '@/types/database'

const getNearbyGymsAction = vi.fn()
const searchGymsAction = vi.fn()
vi.mock('@/app/(app)/gyms/actions', () => ({
  getNearbyGymsAction: (...args: unknown[]) => getNearbyGymsAction(...args),
  searchGymsAction: (...args: unknown[]) => searchGymsAction(...args),
}))

vi.mock('@/components/notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}))
vi.mock('@/components/auth/LogoutButton', () => ({
  LogoutButton: () => <button aria-label="Log out" />,
}))

// The real GymMap wraps MapLibre GL, which needs a canvas/WebGL context
// jsdom doesn't provide — stub it down to the two interactions
// GymsExplorer drives: clicking a marker, and clicking the map background.
vi.mock('./GymMap', () => ({
  GymMap: (props: {
    markers: { id: string }[]
    onMarkerClick?: (id: string) => void
    onBackgroundClick?: () => void
  }) => (
    <div data-testid="gym-map">
      <button onClick={() => props.onBackgroundClick?.()}>map background</button>
      {props.markers.map(m => (
        <button key={m.id} onClick={() => props.onMarkerClick?.(m.id)}>
          marker {m.id}
        </button>
      ))}
    </div>
  ),
}))

import { GymsExplorer } from './GymsExplorer'

// jsdom doesn't implement scrollIntoView — GymsExplorer calls it to bring a
// newly selected gym's list row into view.
Element.prototype.scrollIntoView = vi.fn()

const gym: NearbyGym = {
  id: 'gym-1',
  name: 'Muscle Beach',
  lat: 51.5,
  lng: -0.12,
  status: 'verified',
  distance_m: 250,
} as NearbyGym

beforeEach(() => {
  getNearbyGymsAction.mockReset().mockResolvedValue({ ok: true, data: [gym] })
  searchGymsAction.mockReset().mockResolvedValue({ ok: true, data: [] })
})

describe('GymsExplorer', () => {
  it('loads and lists nearby gyms, with the sheet open by default', async () => {
    render(<GymsExplorer unreadCount={0} />)

    expect(await screen.findByText('Muscle Beach')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search gyms by name…')).toBeInTheDocument()
    // The peek pill (reopen affordance) only renders once the sheet is hidden.
    expect(screen.queryByText(/show 1 nearby gym/i)).not.toBeInTheDocument()
  })

  it('tapping the map background hides the sheet, surfacing a peek pill to reopen it', async () => {
    const user = userEvent.setup()
    render(<GymsExplorer unreadCount={0} />)
    await screen.findByText('Muscle Beach')

    await user.click(screen.getByRole('button', { name: 'map background' }))
    expect(await screen.findByText(/show 1 nearby gym/i)).toBeInTheDocument()

    await user.click(screen.getByText(/show 1 nearby gym/i))
    expect(screen.queryByText(/show 1 nearby gym/i)).not.toBeInTheDocument()
  })

  it('tapping a marker selects it and reopens the sheet if it was hidden', async () => {
    const user = userEvent.setup()
    render(<GymsExplorer unreadCount={0} />)
    await screen.findByText('Muscle Beach')

    await user.click(screen.getByRole('button', { name: 'map background' }))
    await screen.findByText(/show 1 nearby gym/i)

    await user.click(screen.getByRole('button', { name: 'marker gym-1' }))
    expect(screen.queryByText(/show 1 nearby gym/i)).not.toBeInTheDocument()
  })
})
