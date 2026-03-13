import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import OwnerSettingsPage from '../../app/user/owner/[userId]/settings/page'
import { ApiHostelStatus } from '../../types/backend'
import { createBaseHostel, createBaseUser, createImageFile } from '../helpers/mockData'

const useParamsMock = jest.fn()
const refreshMock = jest.fn()
const usersGetMock = jest.fn()
const usersUpdateMock = jest.fn()
const hostelsListMock = jest.fn()
const hostelsCreateMock = jest.fn()
const hostelsUpdateMock = jest.fn()
const amenitiesListMock = jest.fn()
const amenitiesCreateMock = jest.fn()
const hostelAmenitiesListMock = jest.fn()
const hostelAmenitiesCreateMock = jest.fn()
const hostelAmenitiesRemoveMock = jest.fn()
const hostelImagesListMock = jest.fn()
const hostelImagesUploadMock = jest.fn()
const hostelImagesRemoveMock = jest.fn()
const getAccessTokenMock = jest.fn()
const isGoogleMapsUrlMock = jest.fn()
const tryExtractCoordinatesMock = jest.fn()
const buildGoogleMapsQueryUrlMock = jest.fn()
const routerMock = { refresh: refreshMock }

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:owner-preview'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
})

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)
jest.mock('next/image', () => require('./helpers/nextMocks').nextImageModule)

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useParams: (...args: any[]) => useParamsMock(...args),
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  UsersApi: {
    get: (...args: any[]) => usersGetMock(...args),
    update: (...args: any[]) => usersUpdateMock(...args),
  },
  HostelsApi: {
    list: (...args: any[]) => hostelsListMock(...args),
    create: (...args: any[]) => hostelsCreateMock(...args),
    update: (...args: any[]) => hostelsUpdateMock(...args),
  },
  AmenitiesApi: {
    list: (...args: any[]) => amenitiesListMock(...args),
    create: (...args: any[]) => amenitiesCreateMock(...args),
  },
  HostelAmenitiesApi: {
    list: (...args: any[]) => hostelAmenitiesListMock(...args),
    create: (...args: any[]) => hostelAmenitiesCreateMock(...args),
    remove: (...args: any[]) => hostelAmenitiesRemoveMock(...args),
  },
  HostelImagesApi: {
    list: (...args: any[]) => hostelImagesListMock(...args),
    upload: (...args: any[]) => hostelImagesUploadMock(...args),
    remove: (...args: any[]) => hostelImagesRemoveMock(...args),
  },
  ApiError: class extends Error {
    status = 500
  },
}))

jest.mock('../../lib/auth', () => ({
  getAccessToken: (...args: any[]) => getAccessTokenMock(...args),
}))

jest.mock('../../lib/location', () => ({
  isGoogleMapsUrl: (...args: any[]) => isGoogleMapsUrlMock(...args),
  tryExtractCoordinates: (...args: any[]) => tryExtractCoordinatesMock(...args),
  buildGoogleMapsQueryUrl: (...args: any[]) => buildGoogleMapsQueryUrlMock(...args),
}))

describe('Owner settings page', () => {
  beforeEach(() => {
    useParamsMock.mockReset()
    refreshMock.mockReset()
    usersGetMock.mockReset()
    usersUpdateMock.mockReset()
    hostelsListMock.mockReset()
    hostelsCreateMock.mockReset()
    hostelsUpdateMock.mockReset()
    amenitiesListMock.mockReset()
    amenitiesCreateMock.mockReset()
    hostelAmenitiesListMock.mockReset()
    hostelAmenitiesCreateMock.mockReset()
    hostelAmenitiesRemoveMock.mockReset()
    hostelImagesListMock.mockReset()
    hostelImagesUploadMock.mockReset()
    hostelImagesRemoveMock.mockReset()
    getAccessTokenMock.mockReset()
    isGoogleMapsUrlMock.mockReset()
    tryExtractCoordinatesMock.mockReset()
    buildGoogleMapsQueryUrlMock.mockReset()

    useParamsMock.mockReturnValue({ userId: 'owner-1' })
    usersGetMock.mockResolvedValue(
      createBaseUser({
        id: 'owner-1',
        fullName: 'Owner User',
        email: 'owner@example.com',
        phoneNumber: '+94999999999',
        role: 1,
      }),
    )
    hostelsListMock.mockResolvedValue([])
    amenitiesListMock.mockResolvedValue([])
    hostelAmenitiesListMock.mockResolvedValue([])
    hostelImagesListMock.mockResolvedValue([])
    usersUpdateMock.mockResolvedValue({})
    hostelsCreateMock.mockResolvedValue({ id: 'new-hostel-id' })
    getAccessTokenMock.mockReturnValue('token-1')
    isGoogleMapsUrlMock.mockReturnValue(true)
    tryExtractCoordinatesMock.mockReturnValue({ latitude: 6.9, longitude: 79.8 })
    buildGoogleMapsQueryUrlMock.mockReturnValue('https://maps.google.com/?q=6.9,79.8')
  })

  it('saves owner profile and refreshes route', async () => {
    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Owner settings')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => {
      expect(usersUpdateMock).toHaveBeenCalledWith('owner-1', {
        fullName: 'Owner User',
        phoneNumber: '+94999999999',
        role: 1,
      })
      expect(refreshMock).toHaveBeenCalled()
    })
  })

  it('shows maps URL validation error while saving hostel', async () => {
    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Owner settings')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'City Lodge' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Kandy' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Lake Road' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Great place' } })
    fireEvent.change(screen.getByLabelText('Google Maps URL'), { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: 'Submit hostel' }))

    await waitFor(() => {
      expect(screen.getByText('Google Maps URL is required.')).toBeInTheDocument()
    })
    expect(hostelsCreateMock).not.toHaveBeenCalled()
  })

  it('creates hostel when form is valid', async () => {
    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Owner settings')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'City Lodge' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Kandy' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Lake Road' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Great place' } })
    fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '15000' } })
    fireEvent.change(screen.getByLabelText('Gender policy'), { target: { value: 'Mixed' } })
    fireEvent.change(screen.getByLabelText('Google Maps URL'), {
      target: { value: 'https://maps.google.com/?q=6.9,79.8' },
    })
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: String(ApiHostelStatus.Pending) },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit hostel' }))

    await waitFor(() => {
      expect(hostelsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'City Lodge',
          city: 'Kandy',
          address: '1 Lake Road',
          description: 'Great place',
          minPrice: 10000,
          maxPrice: 15000,
          genderPolicy: 'Mixed',
          status: ApiHostelStatus.Pending,
          latitude: 6.9,
          longitude: 79.8,
          googleMapsUrl: 'https://maps.google.com/?q=6.9,79.8',
        }),
      )
    })
  })

  it('validates hostel prices before saving', async () => {
    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Owner settings')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'City Lodge' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Kandy' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Lake Road' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Great place' } })
    fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '20000' } })
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '15000' } })
    fireEvent.change(screen.getByLabelText('Google Maps URL'), {
      target: { value: 'https://maps.google.com/?q=6.9,79.8' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit hostel' }))

    await waitFor(() => {
      expect(screen.getByText('Prices must be valid (max >= min)')).toBeInTheDocument()
    })
    expect(hostelsCreateMock).not.toHaveBeenCalled()
  })

  it('loads an existing hostel for editing and saves changes', async () => {
    hostelsListMock.mockResolvedValue([
      createBaseHostel({
        id: 'hostel-1',
        ownerId: 'owner-1',
        name: 'Amber Stay',
      }),
    ])
    hostelsUpdateMock.mockResolvedValue({})

    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Amber Stay Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(hostelsUpdateMock).toHaveBeenCalledWith(
        'hostel-1',
        expect.objectContaining({
          name: 'Amber Stay Updated',
          ownerId: 'owner-1',
        }),
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel edit' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit hostel' })).toBeInTheDocument()
    })
  })

  it('creates a hostel with a custom amenity and uploaded picture', async () => {
    amenitiesListMock.mockResolvedValue([{ id: 'amenity-existing', name: 'WiFi' }])
    amenitiesCreateMock.mockResolvedValue({ id: 'amenity-new', name: 'Sauna' })
    hostelsCreateMock.mockResolvedValue({ id: 'created-owner-hostel' })

    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Owner settings')).toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const amenitySearchInput = screen.getByPlaceholderText('Search amenities')
    const uploadFile = createImageFile('front.jpg')

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'City Lodge' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Kandy' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Lake Road' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Great place' } })
    fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '15000' } })
    fireEvent.change(screen.getByLabelText('Gender policy'), { target: { value: 'Mixed' } })
    fireEvent.change(screen.getByLabelText('Google Maps URL'), {
      target: { value: 'https://maps.google.com/?q=6.9,79.8' },
    })
    fireEvent.change(amenitySearchInput, { target: { value: 'Sauna' } })
    fireEvent.click(screen.getByRole('button', { name: /Add new amenity/i }))
    fireEvent.change(fileInput, { target: { files: [uploadFile] } })

    await waitFor(() => {
      expect(screen.getByLabelText('Remove front.jpg')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit hostel' }))

    await waitFor(() => {
      expect(amenitiesCreateMock).toHaveBeenCalledWith({ name: 'Sauna' })
      expect(hostelAmenitiesCreateMock).toHaveBeenCalledWith({
        hostelId: 'created-owner-hostel',
        amenityId: 'amenity-new',
      })
      expect(hostelImagesUploadMock).toHaveBeenCalledWith(
        'created-owner-hostel',
        uploadFile,
        'token-1',
        0,
      )
    })
  })
})
