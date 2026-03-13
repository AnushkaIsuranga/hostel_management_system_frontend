import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import StudentSavedHostelsPage from '../../app/user/student/[userId]/hostels/page'
import { createBaseHostel } from '../helpers/mockData'
import { ApiInteractionType } from '../../types/backend'

const useParamsMock = jest.fn()
const listEventsMock = jest.fn()
const listHostelsMock = jest.fn()

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useParams: (...args: any[]) => useParamsMock(...args),
  }),
)

jest.mock('../../lib/backendApi', () => ({
  InteractionEventsApi: {
    list: (...args: any[]) => listEventsMock(...args),
  },
  HostelsApi: {
    list: (...args: any[]) => listHostelsMock(...args),
  },
}))

jest.mock('../../components/Hostelcard', () => {
  return function MockHostelCard({ hostel, isSaved }: any) {
    return (
      <div data-testid={`saved-${hostel.id}`}>
        {hostel.name}-saved:{String(!!isSaved)}
      </div>
    )
  }
})

describe('Student saved hostels page', () => {
  beforeEach(() => {
    useParamsMock.mockReset()
    listEventsMock.mockReset()
    listHostelsMock.mockReset()

    listHostelsMock.mockResolvedValue([
      createBaseHostel({ id: 'h1', name: 'Alpha Hostel' }),
      createBaseHostel({ id: 'h2', name: 'Beta Hostel' }),
    ])
  })

  it('shows error when route userId is missing', async () => {
    useParamsMock.mockReturnValue({})

    render(<StudentSavedHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Missing user id in route')).toBeInTheDocument()
    })
  })

  it('resolves final saved state from save/unsave events', async () => {
    useParamsMock.mockReturnValue({ userId: 'student-1' })
    listEventsMock.mockResolvedValue([
      {
        id: 'e1',
        userId: 'student-1',
        hostelId: 'h1',
        eventType: ApiInteractionType.Save,
        metadata: { action: 'save' },
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'e2',
        userId: 'student-1',
        hostelId: 'h2',
        eventType: ApiInteractionType.Save,
        metadata: { action: 'save' },
        createdAt: '2025-01-02T00:00:00Z',
      },
      {
        id: 'e3',
        userId: 'student-1',
        hostelId: 'h1',
        eventType: ApiInteractionType.Save,
        metadata: { action: 'unsave' },
        createdAt: '2025-01-03T00:00:00Z',
      },
    ])

    render(<StudentSavedHostelsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('saved-h2')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('saved-h1')).not.toBeInTheDocument()
    expect(screen.getByText('1 Saved Hostel')).toBeInTheDocument()
  })
})
