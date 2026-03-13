import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import OwnerProfilePage from '../../app/user/owner/[userId]/page'
import { createBaseHostel } from '../helpers/mockData'
import { ApiHostelStatus } from '../../types/backend'

const useParamsMock = jest.fn()
const usersGetMock = jest.fn()
const hostelsListMock = jest.fn()

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useParams: (...args: any[]) => useParamsMock(...args),
  }),
)

jest.mock('../../lib/backendApi', () => ({
  UsersApi: {
    get: (...args: any[]) => usersGetMock(...args),
  },
  HostelsApi: {
    list: (...args: any[]) => hostelsListMock(...args),
  },
}))

describe('Owner profile page', () => {
  beforeEach(() => {
    useParamsMock.mockReset()
    usersGetMock.mockReset()
    hostelsListMock.mockReset()
  })

  it('renders owner profile, metrics, and hostel preview links', async () => {
    useParamsMock.mockReturnValue({ userId: 'owner-1' })
    usersGetMock.mockResolvedValue({
      id: 'owner-1',
      fullName: 'Owner User',
      email: 'owner@example.com',
      phoneNumber: '+94999999999',
      role: 1,
    })
    hostelsListMock.mockResolvedValue([
      createBaseHostel({ id: 'h1', name: 'Alpha Hostel', status: ApiHostelStatus.Active }),
      createBaseHostel({ id: 'h2', name: 'Beta Hostel', status: ApiHostelStatus.Pending }),
    ])

    render(<OwnerProfilePage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Owner User' })).toBeInTheDocument()
    })

    expect(screen.getByText('Owner dashboard')).toBeInTheDocument()
    expect(screen.getByText('Hostels')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/user/owner/owner-1/settings',
    )
    expect(screen.getAllByRole('link', { name: 'View' })).toHaveLength(2)
  })

  it('shows error message when loading fails', async () => {
    useParamsMock.mockReturnValue({ userId: 'owner-1' })
    usersGetMock.mockRejectedValue(new Error('Load failed'))
    hostelsListMock.mockResolvedValue([])

    render(<OwnerProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Load failed')).toBeInTheDocument()
    })
  })
})
