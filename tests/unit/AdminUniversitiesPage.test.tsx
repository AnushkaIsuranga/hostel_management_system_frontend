import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import AdminUniversitiesPage from '../../app/admin/universities/page'

const listMock = jest.fn()
const createMock = jest.fn()
const updateMock = jest.fn()
const removeMock = jest.fn()
const isGoogleMapsUrlMock = jest.fn()
const tryExtractCoordinatesMock = jest.fn()
const buildGoogleMapsQueryUrlMock = jest.fn()

jest.mock('../../lib/backendApi', () => ({
  UniversitiesApi: {
    list: (...args: any[]) => listMock(...args),
    create: (...args: any[]) => createMock(...args),
    update: (...args: any[]) => updateMock(...args),
    remove: (...args: any[]) => removeMock(...args),
  },
}))

jest.mock('../../lib/location', () => ({
  isGoogleMapsUrl: (...args: any[]) => isGoogleMapsUrlMock(...args),
  tryExtractCoordinates: (...args: any[]) => tryExtractCoordinatesMock(...args),
  buildGoogleMapsQueryUrl: (...args: any[]) => buildGoogleMapsQueryUrlMock(...args),
}))

describe('Admin universities page', () => {
  beforeEach(() => {
    listMock.mockReset()
    createMock.mockReset()
    updateMock.mockReset()
    removeMock.mockReset()
    isGoogleMapsUrlMock.mockReset()
    tryExtractCoordinatesMock.mockReset()
    buildGoogleMapsQueryUrlMock.mockReset()

    listMock.mockResolvedValue([
      { id: 'uni-1', name: 'University A', latitude: 6.9, longitude: 79.8 },
    ])

    isGoogleMapsUrlMock.mockReturnValue(true)
    tryExtractCoordinatesMock.mockReturnValue({ latitude: 6.9, longitude: 79.8 })
    buildGoogleMapsQueryUrlMock.mockReturnValue('https://maps.google.com/?q=6.9,79.8')
    ;(window.confirm as any) = jest.fn(() => true)
  })

  it('loads university list', async () => {
    render(<AdminUniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('University A')).toBeInTheDocument()
    })
  })

  it('validates maps URL before submit', async () => {
    isGoogleMapsUrlMock.mockReturnValue(false)

    const { container } = render(<AdminUniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('University A')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New University' }))
    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    fireEvent.change(drawerInputs[0], { target: { value: 'University B' } })
    fireEvent.change(drawerInputs[1], { target: { value: 'bad-url' } })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid Google Maps URL.')).toBeInTheDocument()
    })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('creates a university with parsed coordinates', async () => {
    createMock.mockResolvedValue({})

    const { container } = render(<AdminUniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('University A')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New University' }))
    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    fireEvent.change(drawerInputs[0], { target: { value: 'University C' } })
    fireEvent.change(drawerInputs[1], {
      target: { value: 'https://maps.google.com/?q=6.8,79.9' },
    })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        name: 'University C',
        latitude: 6.9,
        longitude: 79.8,
        locationUrl: 'https://maps.google.com/?q=6.8,79.9',
      })
    })
  })
})

