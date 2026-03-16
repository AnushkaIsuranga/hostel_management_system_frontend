import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import OwnerSettingsPage from '../../app/user/owner/[userId]/settings/page'
import { createBaseUser } from '../helpers/mockData'

const useParamsMock = jest.fn()
const refreshMock = jest.fn()
const usersGetMock = jest.fn()
const usersUpdateMock = jest.fn()
const routerMock = { refresh: refreshMock }

jest.mock('next/link', () => jest.requireActual('../helpers/nextMocks').nextLinkModule)

jest.mock('next/navigation', () =>
  jest.requireActual('../helpers/navigationMocks').createNextNavigationModule({
    useParams: (...args: any[]) => useParamsMock(...args),
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  UsersApi: {
    get: (...args: any[]) => usersGetMock(...args),
    update: (...args: any[]) => usersUpdateMock(...args),
  },
}))

describe('Owner settings page', () => {
  beforeEach(() => {
    useParamsMock.mockReset()
    refreshMock.mockReset()
    usersGetMock.mockReset()
    usersUpdateMock.mockReset()

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
    usersUpdateMock.mockResolvedValue({})
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

  it('shows a read-only email field and no hostel customization UI', async () => {
    render(<OwnerSettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('owner@example.com')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Email address')).toHaveAttribute('readonly')
    expect(screen.queryByText('Hostels')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit hostel' })).not.toBeInTheDocument()
  })
})
