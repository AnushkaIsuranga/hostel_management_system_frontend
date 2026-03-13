import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'

import AdminDashboardPage from '../../app/admin/dashboard/page'
import { createAmenity, createBaseHostel, createBaseUser, daysAgoIso } from '../helpers/mockData'
import { ApiHostelVerificationStatus, ApiInteractionType } from '../../types/backend'

const hostelsListMock = jest.fn()
const usersByRoleMock = jest.fn()
const usersStatsMock = jest.fn()
const amenitiesListMock = jest.fn()
const universitiesListMock = jest.fn()
const interactionEventsListMock = jest.fn()
const hostelReviewsListMock = jest.fn()
const hostelVerificationListRequestsMock = jest.fn()
const hostelSubscriptionGetMock = jest.fn()

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)

jest.mock('../../lib/backendApi', () => ({
  HostelsApi: {
    list: (...args: any[]) => hostelsListMock(...args),
    reviews: {
      list: (...args: any[]) => hostelReviewsListMock(...args),
    },
    verification: {
      listRequests: (...args: any[]) => hostelVerificationListRequestsMock(...args),
    },
    subscription: {
      get: (...args: any[]) => hostelSubscriptionGetMock(...args),
    },
  },
  UsersApi: {
    byRole: (...args: any[]) => usersByRoleMock(...args),
    stats: (...args: any[]) => usersStatsMock(...args),
  },
  AmenitiesApi: {
    list: (...args: any[]) => amenitiesListMock(...args),
  },
  UniversitiesApi: {
    list: (...args: any[]) => universitiesListMock(...args),
  },
  InteractionEventsApi: {
    list: (...args: any[]) => interactionEventsListMock(...args),
  },
}))

describe('Admin dashboard page', () => {
  beforeEach(() => {
    const now = Date.now()
    const oneDayAgo = daysAgoIso(1, now)
    const fourDaysAgo = daysAgoIso(4, now)
    const twoDaysAgo = daysAgoIso(2, now)
    const eightDaysAgo = daysAgoIso(8, now)

    hostelsListMock.mockReset()
    usersByRoleMock.mockReset()
    usersStatsMock.mockReset()
    amenitiesListMock.mockReset()
    universitiesListMock.mockReset()
    interactionEventsListMock.mockReset()
    hostelReviewsListMock.mockReset()
    hostelVerificationListRequestsMock.mockReset()
    hostelSubscriptionGetMock.mockReset()

    hostelsListMock.mockResolvedValue([
      createBaseHostel({
        id: 'hostel-1',
        name: 'Amber Stay',
        ownerId: 'owner-1',
        city: 'Colombo',
        images: [],
        description: '',
        verificationStatus: ApiHostelVerificationStatus.Pending,
        isVerified: false,
        createdAt: twoDaysAgo,
      }),
      createBaseHostel({
        id: 'hostel-2',
        name: 'Lake View',
        ownerId: 'owner-2',
        city: 'Kandy',
        verificationStatus: ApiHostelVerificationStatus.Approved,
        createdAt: eightDaysAgo,
      }),
      createBaseHostel({
        id: 'hostel-3',
        name: 'Campus Nest',
        ownerId: 'owner-1',
        city: 'Colombo',
        verificationStatus: ApiHostelVerificationStatus.Rejected,
        images: [],
        createdAt: oneDayAgo,
      }),
    ])

    usersByRoleMock.mockResolvedValue([
      createBaseUser({
        id: 'owner-1',
        fullName: 'Owner One',
        email: 'owner1@example.com',
        phoneNumber: '+94111111111',
        role: 1,
        createdAt: oneDayAgo,
      }),
      createBaseUser({
        id: 'owner-2',
        fullName: 'Owner Two',
        email: 'owner2@example.com',
        phoneNumber: '+94222222222',
        role: 1,
        createdAt: eightDaysAgo,
      }),
    ])
    usersStatsMock.mockResolvedValue({
      hostels: { totalCount: 3, last7DaysCount: 2 },
      users: { totalCount: 12, last7DaysCount: 4 },
      reviews: { totalCount: 18, last7DaysCount: 7 },
    })
    amenitiesListMock.mockResolvedValue([createAmenity(), createAmenity({ id: 'a2', name: 'AC' })])
    universitiesListMock.mockResolvedValue([{ id: 'u1', name: 'Uni A' }])
    interactionEventsListMock.mockResolvedValue([
      {
        id: 'e1',
        userId: null,
        hostelId: 'hostel-1',
        eventType: ApiInteractionType.ViewHostel,
        sessionId: 's1',
        metadata: null,
        createdAt: oneDayAgo,
      },
      {
        id: 'e2',
        userId: null,
        hostelId: 'hostel-1',
        eventType: ApiInteractionType.ContactOwner,
        sessionId: 's2',
        metadata: { action: 'map_click' },
        createdAt: oneDayAgo,
      },
      {
        id: 'e3',
        userId: null,
        hostelId: 'hostel-1',
        eventType: ApiInteractionType.ContactOwner,
        sessionId: 's3',
        metadata: { action: 'review_submit' },
        createdAt: oneDayAgo,
      },
      {
        id: 'e4',
        userId: null,
        hostelId: 'hostel-2',
        eventType: ApiInteractionType.ViewHostel,
        sessionId: 's4',
        metadata: null,
        createdAt: fourDaysAgo,
      },
    ])
    hostelReviewsListMock.mockImplementation((hostelId: string) => {
      if (hostelId === 'hostel-1') {
        return Promise.resolve([{ id: 'r1', createdAt: oneDayAgo }])
      }
      return Promise.resolve([])
    })
    hostelVerificationListRequestsMock.mockImplementation((hostelId: string) => {
      if (hostelId === 'hostel-1') {
        return Promise.resolve([
          {
            id: 'v1',
            hostelId,
            requestedByUserId: 'owner-1',
            status: ApiHostelVerificationStatus.Pending,
            notes: null,
            createdAt: fourDaysAgo,
            updatedAt: null,
          },
        ])
      }
      return Promise.resolve([])
    })
    hostelSubscriptionGetMock.mockImplementation((hostelId: string) =>
      Promise.resolve({ isActive: hostelId === 'hostel-1' }),
    )
  })

  it('renders dashboard stats, alerts, and recent activity', async () => {
    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
    })

    expect(screen.getByText('3 hostels · 12 users · 1 pending verification')).toBeInTheDocument()
    const usersCard = screen.getByText('Users (7 days)').closest('a') as HTMLElement
    const reviewsCard = screen.getByText('Reviews (7 days)').closest('div.group') as HTMLElement
    expect(within(usersCard).getByText('4')).toBeInTheDocument()
    expect(within(usersCard).getByText('12 total users')).toBeInTheDocument()
    expect(within(reviewsCard).getByText('7')).toBeInTheDocument()
    expect(within(reviewsCard).getByText('18 total reviews')).toBeInTheDocument()
    expect(screen.getByText('Pending: 1')).toBeInTheDocument()
    expect(screen.getByText('Average wait: 4 days')).toBeInTheDocument()
    expect(
      screen.getByText('1 hostels pending verification for more than 3 days'),
    ).toBeInTheDocument()
    expect(screen.getByText('2 listings have no images')).toBeInTheDocument()
    expect(screen.getByText('2 listings have no reviews yet')).toBeInTheDocument()
    expect(screen.getAllByText('Amber Stay').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1 views').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Owner One').length).toBeGreaterThan(0)
    expect(screen.getByText('review submit - Amber Stay')).toBeInTheDocument()
  })

  it('shows a dashboard error when hostels and stats fail to load', async () => {
    hostelsListMock.mockRejectedValueOnce(new Error('Hostels unavailable'))
    usersByRoleMock.mockResolvedValueOnce([])
    usersStatsMock.mockRejectedValueOnce(new Error('Stats unavailable'))

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
    })
  })
})
