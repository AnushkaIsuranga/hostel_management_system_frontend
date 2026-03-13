import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import HostelDetailsPage from '../../app/(marketing)/hostels/[hostelId]/page'
import { createBaseHostel } from '../helpers/mockData'

const useParamsMock = jest.fn()
const getHostelMock = jest.fn()
const reviewsSummaryMock = jest.fn()
const reviewsListMock = jest.fn()
const reviewsCreateMock = jest.fn()
const amenitiesListMock = jest.fn()
const hostelAmenitiesListMock = jest.fn()
const hostelImagesListMock = jest.fn()
const usersGetMock = jest.fn()
const getAccessTokenMock = jest.fn()
const trackInteractionEventMock = jest.fn()
const buildGoogleMapsQueryUrlMock = jest.fn()

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)
jest.mock('next/image', () => require('./helpers/nextMocks').nextImageModule)

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useParams: (...args: any[]) => useParamsMock(...args),
  }),
)

jest.mock('../../lib/backendApi', () => ({
  HostelsApi: {
    get: (...args: any[]) => getHostelMock(...args),
    reviews: {
      summary: (...args: any[]) => reviewsSummaryMock(...args),
      list: (...args: any[]) => reviewsListMock(...args),
      create: (...args: any[]) => reviewsCreateMock(...args),
    },
  },
  AmenitiesApi: {
    list: (...args: any[]) => amenitiesListMock(...args),
  },
  HostelAmenitiesApi: {
    list: (...args: any[]) => hostelAmenitiesListMock(...args),
  },
  HostelImagesApi: {
    list: (...args: any[]) => hostelImagesListMock(...args),
  },
  UsersApi: {
    get: (...args: any[]) => usersGetMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  getAccessToken: (...args: any[]) => getAccessTokenMock(...args),
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

jest.mock('../../lib/location', () => ({
  buildGoogleMapsQueryUrl: (...args: any[]) => buildGoogleMapsQueryUrlMock(...args),
}))

describe('Marketing hostel details page', () => {
  const hostel = createBaseHostel({
    id: 'hostel-1',
    name: 'Amber Residency',
    city: 'Colombo',
    address: '12 Main Street',
    description: 'Clean and student-friendly',
    minPrice: 10000,
    maxPrice: 10000,
    latitude: 6.9,
    longitude: 79.8,
    ownerId: 'owner-1',
    images: ['/uploads/h-1.jpg'],
    googleMapsUrl: '',
  })

  beforeEach(() => {
    useParamsMock.mockReset()
    getHostelMock.mockReset()
    reviewsSummaryMock.mockReset()
    reviewsListMock.mockReset()
    reviewsCreateMock.mockReset()
    amenitiesListMock.mockReset()
    hostelAmenitiesListMock.mockReset()
    hostelImagesListMock.mockReset()
    usersGetMock.mockReset()
    getAccessTokenMock.mockReset()
    trackInteractionEventMock.mockReset()
    buildGoogleMapsQueryUrlMock.mockReset()

    useParamsMock.mockReturnValue({ hostelId: 'hostel-1' })
    getHostelMock.mockResolvedValue(hostel)
    reviewsSummaryMock.mockResolvedValue({ averageRating: 4.5, reviewCount: 1 })
    reviewsListMock.mockResolvedValue([
      {
        id: 'r1',
        userId: 'u1',
        userFullName: 'Alice',
        rating: 4,
        comment: 'Great stay',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ])
    amenitiesListMock.mockResolvedValue([{ id: 'a1', name: 'WiFi' }])
    hostelAmenitiesListMock.mockResolvedValue([{ hostelId: 'hostel-1', amenityId: 'a1' }])
    hostelImagesListMock.mockResolvedValue([])
    usersGetMock.mockResolvedValue({ phoneNumber: '+94112223333', email: 'owner@example.com' })
    buildGoogleMapsQueryUrlMock.mockReturnValue('https://maps.example.com/query')
    getAccessTokenMock.mockReturnValue(null)
  })

  it('loads and renders hostel details content', async () => {
    render(<HostelDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Amber Residency' })).toBeInTheDocument()
    })

    expect(screen.getByText('About this property')).toBeInTheDocument()
    expect(screen.getByText('Clean and student-friendly')).toBeInTheDocument()
    expect(screen.getByText('Amenities')).toBeInTheDocument()
    expect(screen.getByText('WiFi')).toBeInTheDocument()
    expect(trackInteractionEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ hostelId: 'hostel-1' }),
    )
  })

  it('shows sign-in prompt for review when user is logged out', async () => {
    render(<HostelDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Share your experience')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?next=/hostels/hostel-1',
    )
  })

  it('submits a review when user is logged in', async () => {
    getAccessTokenMock.mockReturnValue('token-1')
    reviewsCreateMock.mockResolvedValue({})

    render(<HostelDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Share your experience')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }))
    fireEvent.change(screen.getByLabelText('Comment (optional)'), {
      target: { value: 'Really nice and safe place' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))

    await waitFor(() => {
      expect(reviewsCreateMock).toHaveBeenCalledWith(
        'hostel-1',
        { rating: 4, comment: 'Really nice and safe place' },
        'token-1',
      )
    })

    expect(reviewsSummaryMock).toHaveBeenCalledTimes(2)
    expect(reviewsListMock).toHaveBeenCalledTimes(2)
  })

  it('shows an error when the route is missing a hostel id', async () => {
    useParamsMock.mockReturnValue({})

    render(<HostelDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Missing hostel id in route')).toBeInTheDocument()
    })
  })

  it('requires a rating before submitting a logged-in review', async () => {
    getAccessTokenMock.mockReturnValue('token-1')

    render(<HostelDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Share your experience')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))

    await waitFor(() => {
      expect(screen.getByText('Please select a rating from 1 to 5 stars.')).toBeInTheDocument()
    })
    expect(reviewsCreateMock).not.toHaveBeenCalled()
  })

  it('renders contact links and opens the gallery lightbox', async () => {
    hostelImagesListMock.mockResolvedValue([
      { id: 'img-1', fileName: 'Front view', imageUrl: '/uploads/front.jpg', displayOrder: 0 },
      { id: 'img-2', fileName: 'Room', imageUrl: '/uploads/room.jpg', displayOrder: 1 },
    ])

    render(<HostelDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Amber Residency' })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Call owner' })).toHaveAttribute(
      'href',
      'tel:+94112223333',
    )
    expect(screen.getByRole('link', { name: 'Email owner' })).toHaveAttribute(
      'href',
      'mailto:owner@example.com',
    )

    fireEvent.click(screen.getByText('View all 3 photos'))

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    expect(trackInteractionEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { action: 'gallery_open', index: 0 } }),
    )
  })
})
