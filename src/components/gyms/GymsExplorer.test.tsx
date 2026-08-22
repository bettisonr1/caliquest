import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GymSearchResult, NearbyGym } from '@/types/database'

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
// jsdom doesn't provide — stub it down to the interactions GymsExplorer
// drives: clicking a marker, and clicking the map background.
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

const gym: NearbyGym = {
  id: 'gym-1',
  name: 'Muscle Beach',
  lat: 51.5,
  lng: -0.12,
  status: 'verified',
  equipment: { pull_up_bar: true },
  distance_m: 250,
} as NearbyGym

const searchedGym: GymSearchResult = {
  id: 'gym-2',
  name: 'Iron Yard',
  lat: 51.52,
  lng: -0.1,
  status: 'unverified',
  equipment: {},
}

beforeEach(() => {
  getNearbyGymsAction.mockReset().mockResolvedValue({ ok: true, data: [gym] })
  searchGymsAction.mockReset().mockResolvedValue({ ok: true, data: [searchedGym] })
})

describe('GymsExplorer', () => {
  it('loads nearby gyms as map markers, with search collapsed and no list', async () => {
    render(<GymsExplorer unreadCount={0} />)

    expect(await screen.findByRole('button', { name: 'marker gym-1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search gyms' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search gyms by name…')).not.toBeInTheDocument()
    expect(screen.queryByText('Muscle Beach')).not.toBeInTheDocument()
  })

  it('tapping a marker opens a preview card with a link to the gym', async () => {
    const user = userEvent.setup()
    render(<GymsExplorer unreadCount={0} />)

    await user.click(await screen.findByRole('button', { name: 'marker gym-1' }))

    expect(await screen.findByText('Muscle Beach')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    const viewLink = screen.getByRole('link', { name: 'View gym' })
    expect(viewLink).toHaveAttribute('href', expect.stringContaining('/gyms/gym-1'))
  })

  it('tapping the map background dismisses an open preview card', async () => {
    const user = userEvent.setup()
    render(<GymsExplorer unreadCount={0} />)

    await user.click(await screen.findByRole('button', { name: 'marker gym-1' }))
    expect(await screen.findByText('Muscle Beach')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'map background' }))
    expect(screen.queryByText('Muscle Beach')).not.toBeInTheDocument()
  })

  it('opens a search overlay from the search icon and selects a result into a preview card', async () => {
    const user = userEvent.setup()
    render(<GymsExplorer unreadCount={0} />)
    await screen.findByRole('button', { name: 'marker gym-1' })

    await user.click(screen.getByRole('button', { name: 'Search gyms' }))
    const input = screen.getByPlaceholderText('Search gyms by name…')
    await user.type(input, 'Iron')

    const result = await screen.findByText('Iron Yard')
    await user.click(result)

    // Search closes and the picked gym surfaces in a preview card.
    expect(screen.queryByPlaceholderText('Search gyms by name…')).not.toBeInTheDocument()
    expect(screen.getAllByText('Iron Yard')).toHaveLength(1)
    expect(screen.getByText('Rumored Spot')).toBeInTheDocument()
  })
})
