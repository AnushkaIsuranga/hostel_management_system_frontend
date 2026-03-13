import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import MarketingHostelsPage from '../../app/(marketing)/hostels/page'
import { createBaseHostel } from '../helpers/mockData'
import { ApiHostelStatus, ApiInteractionType, ApiUserRole } from '../../types/backend'

const listMock = jest.fn()
const searchMock = jest.fn()
const listEventsMock = jest.fn()
const getStoredRoleMock = jest.fn()
const getStoredUserIdMock = jest.fn()
const trackInteractionEventMock = jest.fn()

jest.mock('../../components/Filters', () => {
  return function MockFilters({ filters, onFiltersChange, onReset }: any) {
    return (
      <div>
        <div data-testid="filters-state">verified:{String(!!filters.verifiedOnly)}</div>
        <button type="button" onClick={() => onFiltersChange({ ...filters, verifiedOnly: true })}>
          Apply Verified Filter
        </button>
        <button type="button" onClick={onReset}>
          Reset Filters
        </button>
      </div>
    )
  }
})

jest.mock('../../components/Hostelcard', () => {
  return function MockHostelCard({ hostel, isSaved, onSave, onView }: any) {
    return (
      <div data-testid={`hostel-${hostel.id}`}>
        <p>{hostel.name}</p>
        <p>saved:{String(!!isSaved)}</p>
        <button type="button" onClick={() => onSave(hostel.id)}>
          Save {hostel.id}
        </button>
        <button type="button" onClick={() => onView(hostel.id)}>
          View {hostel.id}
        </button>
      </div>
    )
  }
})

jest.mock('../../lib/backendApi', () => ({
  HostelsApi: {
    list: (...args: any[]) => listMock(...args),
    search: (...args: any[]) => searchMock(...args),
  },
  InteractionEventsApi: {
    list: (...args: any[]) => listEventsMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  getStoredRole: (...args: any[]) => getStoredRoleMock(...args),
  getStoredUserId: (...args: any[]) => getStoredUserIdMock(...args),
}))

jest.mock('../../lib/interactionTracking', () => ({
  ApiInteractionType: {
    ViewHostel: 0,
    Search: 1,
    FilterApply: 2,
    Save: 3,
    ContactOwner: 4,
  },
  trackInteractionEvent: (...args: any[]) => trackInteractionEventMock(...args),
}))

describe('Marketing hostels page', () => {
  const hostelA = createBaseHostel({
    id: 'h-1',
    name: 'Amber Stay',
    minPrice: 10000,
    maxPrice: 15000,
    createdAt: '2025-01-01T00:00:00Z',
    status: ApiHostelStatus.Active,
  })

  const hostelB = createBaseHostel({
    id: 'h-2',
    name: 'Campus Nest',
    city: 'Kandy',
    minPrice: 8000,
    maxPrice: 9000,
    createdAt: '2025-02-01T00:00:00Z',
    status: ApiHostelStatus.Pending,
    isVerified: false,
  })

  beforeEach(() => {
    listMock.mockReset()
    searchMock.mockReset()
    listEventsMock.mockReset()
    getStoredRoleMock.mockReset()
    getStoredUserIdMock.mockReset()
    trackInteractionEventMock.mockReset()

    jest.useFakeTimers()

    getStoredUserIdMock.mockReturnValue(undefined)
    getStoredRoleMock.mockReturnValue(undefined)
    listMock.mockResolvedValue([hostelA, hostelB])
    searchMock.mockResolvedValue([{ hostel: hostelA }, { hostel: hostelB }])
    listEventsMock.mockResolvedValue([])
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('loads hostels with list API for guests', async () => {
    render(<MarketingHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
      expect(screen.getByText('Campus Nest')).toBeInTheDocument()
    })

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(searchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Browse 2 hostels')).toBeInTheDocument()
  })

  it('for student users falls back to list when search fails and resolves saved state', async () => {
    getStoredUserIdMock.mockReturnValue('student-1')
    getStoredRoleMock.mockReturnValue(ApiUserRole.Student)
    searchMock.mockRejectedValue(new Error('search failed'))
    listEventsMock.mockResolvedValue([
      {
        id: 'e1',
        userId: 'student-1',
        hostelId: 'h-1',
        eventType: ApiInteractionType.Save,
        metadata: { action: 'save' },
        createdAt: '2025-03-01T00:00:00Z',
      },
      {
        id: 'e2',
        userId: 'student-1',
        hostelId: 'h-2',
        eventType: ApiInteractionType.Save,
        metadata: { action: 'unsave' },
        createdAt: '2025-03-02T00:00:00Z',
      },
    ])

    render(<MarketingHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    expect(searchMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(listEventsMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('saved:true')).toBeInTheDocument()
  })

  it('tracks save, view, and search interactions', async () => {
    render(<MarketingHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save h-1' }))
    fireEvent.click(screen.getByRole('button', { name: 'View h-1' }))

    fireEvent.change(screen.getByPlaceholderText('Search by name, location, or description...'), {
      target: { value: 'amber' },
    })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(trackInteractionEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: ApiInteractionType.Save, hostelId: 'h-1' }),
      )
      expect(trackInteractionEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: ApiInteractionType.ViewHostel, hostelId: 'h-1' }),
      )
      expect(trackInteractionEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ApiInteractionType.Search,
          metadata: expect.objectContaining({ query: 'amber' }),
        }),
      )
    })
  })
})
