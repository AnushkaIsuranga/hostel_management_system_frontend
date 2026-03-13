import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import AdminHostelsPage from '../../app/admin/hostels/page'
import { createBaseHostel } from '../helpers/mockData'
import { ApiHostelStatus } from '../../types/backend'

const hostelsListMock = jest.fn()
const hostelsCreateMock = jest.fn()
const hostelsUpdateMock = jest.fn()
const hostelsRemoveMock = jest.fn()
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

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:preview-image'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
})

jest.mock('next/image', () => require('./helpers/nextMocks').nextImageModule)

jest.mock('../../lib/backendApi', () => ({
  HostelsApi: {
    list: (...args: any[]) => hostelsListMock(...args),
    create: (...args: any[]) => hostelsCreateMock(...args),
    update: (...args: any[]) => hostelsUpdateMock(...args),
    remove: (...args: any[]) => hostelsRemoveMock(...args),
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
  buildGoogleMapsQueryUrl: jest.fn(() => 'https://maps.google.com/?q=6.9,79.8'),
  isGoogleMapsUrl: (...args: any[]) => isGoogleMapsUrlMock(...args),
  tryExtractCoordinates: (...args: any[]) => tryExtractCoordinatesMock(...args),
}))

describe('Admin hostels page', () => {
  beforeEach(() => {
    hostelsListMock.mockReset()
    hostelsCreateMock.mockReset()
    hostelsUpdateMock.mockReset()
    hostelsRemoveMock.mockReset()
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

    hostelsListMock.mockResolvedValue([
      createBaseHostel({
        id: 'hostel-1',
        name: 'Amber Stay',
        city: 'Colombo',
        minPrice: 9000,
        maxPrice: 12000,
        status: ApiHostelStatus.Pending,
      }),
    ])
    amenitiesListMock.mockResolvedValue([])
    amenitiesCreateMock.mockResolvedValue({ id: 'amenity-1', name: 'WiFi' })
    hostelAmenitiesListMock.mockResolvedValue([])
    hostelAmenitiesCreateMock.mockResolvedValue({})
    hostelAmenitiesRemoveMock.mockResolvedValue({})
    hostelImagesListMock.mockResolvedValue([])
    hostelImagesUploadMock.mockResolvedValue({})
    hostelImagesRemoveMock.mockResolvedValue({})
    hostelsUpdateMock.mockResolvedValue({})
    hostelsRemoveMock.mockResolvedValue({})
    getAccessTokenMock.mockReturnValue('token')
    isGoogleMapsUrlMock.mockReturnValue(true)
    tryExtractCoordinatesMock.mockReturnValue({ latitude: 6.9, longitude: 79.8 })
  })

  it('loads and displays hostels', async () => {
    render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows validation error when maps URL is missing', async () => {
    const { container } = render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New Hostel' }))
    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    fireEvent.change(drawerInputs[0], { target: { value: 'New Hostel' } })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getByText('Google Maps URL is required.')).toBeInTheDocument()
    })
    expect(hostelsCreateMock).not.toHaveBeenCalled()
  })

  it('creates hostel when form is valid', async () => {
    hostelsCreateMock.mockResolvedValue({ id: 'new-hostel-1' })

    const { container } = render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New Hostel' }))
    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    const drawerTextarea = drawer.querySelector('textarea') as HTMLTextAreaElement

    fireEvent.change(drawerInputs[0], { target: { value: 'City Lodge' } })
    fireEvent.change(drawerTextarea, { target: { value: 'Great place' } })
    fireEvent.change(drawerInputs[1], { target: { value: 'Kandy' } })
    fireEvent.change(drawerInputs[2], { target: { value: '1 Lake Rd' } })
    fireEvent.change(drawerInputs[3], { target: { value: '10000' } })
    fireEvent.change(drawerInputs[4], { target: { value: '15000' } })
    fireEvent.change(drawerInputs[5], { target: { value: 'Mixed' } })
    fireEvent.change(drawerInputs[6], {
      target: { value: 'https://maps.google.com/?q=6.9,79.8' },
    })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(hostelsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'City Lodge',
          city: 'Kandy',
          address: '1 Lake Rd',
          minPrice: 10000,
          maxPrice: 15000,
          genderPolicy: 'Mixed',
          latitude: 6.9,
          longitude: 79.8,
          googleMapsUrl: 'https://maps.google.com/?q=6.9,79.8',
        }),
      )
    })
  })

  it('shows validation error when maps URL is invalid', async () => {
    isGoogleMapsUrlMock.mockReturnValue(false)

    const { container } = render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New Hostel' }))
    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    const drawerTextarea = drawer.querySelector('textarea') as HTMLTextAreaElement

    fireEvent.change(drawerInputs[0], { target: { value: 'City Lodge' } })
    fireEvent.change(drawerTextarea, { target: { value: 'Great place' } })
    fireEvent.change(drawerInputs[1], { target: { value: 'Kandy' } })
    fireEvent.change(drawerInputs[2], { target: { value: '1 Lake Rd' } })
    fireEvent.change(drawerInputs[6], { target: { value: 'https://example.com/not-maps' } })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid Google Maps URL.')).toBeInTheDocument()
    })
    expect(hostelsCreateMock).not.toHaveBeenCalled()
  })

  it('updates an existing hostel in edit mode', async () => {
    hostelsListMock.mockResolvedValue([
      createBaseHostel({
        id: 'hostel-1',
        name: 'Amber Stay',
        ownerId: 'owner-1',
        googleMapsUrl: 'https://maps.google.com/?q=6.9,79.8',
      }),
    ])

    const { container } = render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    const drawerTextarea = drawer.querySelector('textarea') as HTMLTextAreaElement

    fireEvent.change(drawerInputs[0], { target: { value: 'Amber Stay Updated' } })
    fireEvent.change(drawerTextarea, { target: { value: 'Updated description' } })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(hostelsUpdateMock).toHaveBeenCalledWith(
        'hostel-1',
        expect.objectContaining({
          name: 'Amber Stay Updated',
          description: 'Updated description',
          ownerId: 'owner-1',
          googleMapsUrl: 'https://maps.google.com/?q=6.9,79.8',
        }),
      )
    })
  })

  it('deletes a hostel after confirmation', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(hostelsRemoveMock).toHaveBeenCalledWith('hostel-1')
    })

    confirmSpy.mockRestore()
  })

  it('creates custom amenities and uploads selected pictures', async () => {
    amenitiesListMock.mockResolvedValue([{ id: 'amenity-existing', name: 'WiFi' }])
    amenitiesCreateMock.mockResolvedValue({ id: 'amenity-new', name: 'Sauna' })
    hostelsCreateMock.mockResolvedValue({ id: 'created-hostel-1' })

    const { container } = render(<AdminHostelsPage />)

    await waitFor(() => {
      expect(screen.getByText('Amber Stay')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New Hostel' }))

    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    const drawerTextarea = drawer.querySelector('textarea') as HTMLTextAreaElement
    const fileInput = drawer.querySelector('input[type="file"]') as HTMLInputElement
    const amenitySearchInput = drawer.querySelector(
      'input[placeholder="Search amenities"]',
    ) as HTMLInputElement
    const uploadFile = new File(['image-bytes'], 'room.jpg', { type: 'image/jpeg' })

    fireEvent.change(drawerInputs[0], { target: { value: 'City Lodge' } })
    fireEvent.change(drawerTextarea, { target: { value: 'Great place' } })
    fireEvent.change(drawerInputs[1], { target: { value: 'Kandy' } })
    fireEvent.change(drawerInputs[2], { target: { value: '1 Lake Rd' } })
    fireEvent.change(drawerInputs[3], { target: { value: '10000' } })
    fireEvent.change(drawerInputs[4], { target: { value: '15000' } })
    fireEvent.change(drawerInputs[5], { target: { value: 'Mixed' } })
    fireEvent.change(drawerInputs[6], {
      target: { value: 'https://maps.google.com/?q=6.9,79.8' },
    })
    fireEvent.change(amenitySearchInput, { target: { value: 'Sauna' } })
    fireEvent.click(within(drawer).getByRole('button', { name: /Add new amenity/i }))
    fireEvent.change(fileInput, { target: { files: [uploadFile] } })

    await waitFor(() => {
      expect(within(drawer).getByLabelText('Remove room.jpg')).toBeInTheDocument()
    })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(amenitiesCreateMock).toHaveBeenCalledWith({ name: 'Sauna' })
      expect(hostelAmenitiesCreateMock).toHaveBeenCalledWith({
        hostelId: 'created-hostel-1',
        amenityId: 'amenity-new',
      })
      expect(hostelImagesUploadMock).toHaveBeenCalledWith(
        'created-hostel-1',
        uploadFile,
        'token',
        0,
      )
    })
  })
})
