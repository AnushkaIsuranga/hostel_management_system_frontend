import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import UserPage from '../../app/user/page'
import { ApiUserRole } from '../../types/backend'

const replaceMock = jest.fn()
const listMock = jest.fn()
const getStoredRoleMock = jest.fn()
const getStoredUserIdMock = jest.fn()
const routerMock = { replace: replaceMock }

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  UsersApi: {
    list: (...args: any[]) => listMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  getStoredRole: (...args: any[]) => getStoredRoleMock(...args),
  getStoredUserId: (...args: any[]) => getStoredUserIdMock(...args),
}))

describe('User root page', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    listMock.mockReset()
    getStoredRoleMock.mockReset()
    getStoredUserIdMock.mockReset()

    listMock.mockResolvedValue([
      {
        id: 'u1',
        fullName: 'Alice Student',
        email: 'alice@example.com',
        phoneNumber: '+94111111111',
        role: ApiUserRole.Student,
      },
      {
        id: 'u2',
        fullName: 'Bob Owner',
        email: 'owner@example.com',
        phoneNumber: '+94222222222',
        role: ApiUserRole.Owner,
      },
    ])
  })

  it('redirects non-admin owner to own profile', async () => {
    getStoredRoleMock.mockReturnValue(ApiUserRole.Owner)
    getStoredUserIdMock.mockReturnValue('owner-1')

    render(<UserPage />)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/user/owner/owner-1')
    })
    expect(listMock).not.toHaveBeenCalled()
  })

  it('loads users list for admin and supports search', async () => {
    getStoredRoleMock.mockReturnValue(ApiUserRole.Admin)
    getStoredUserIdMock.mockReturnValue('admin-1')

    render(<UserPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice Student')).toBeInTheDocument()
      expect(screen.getByText('Bob Owner')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Search by name or email'), {
      target: { value: 'alice' },
    })

    expect(screen.getByText('Alice Student')).toBeInTheDocument()
    expect(screen.queryByText('Bob Owner')).not.toBeInTheDocument()
  })
})

