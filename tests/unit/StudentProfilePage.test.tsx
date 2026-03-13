import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import StudentProfilePage from '../../app/user/student/[userId]/page'

const useParamsMock = jest.fn()
const usersGetMock = jest.fn()

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
}))

describe('Student profile page', () => {
  beforeEach(() => {
    useParamsMock.mockReset()
    usersGetMock.mockReset()
  })

  it('renders profile details and links', async () => {
    useParamsMock.mockReturnValue({ userId: 'student-1' })
    usersGetMock.mockResolvedValue({
      id: 'student-1',
      fullName: 'Alice Student',
      email: 'alice@example.com',
      phoneNumber: '+94111111111',
      role: 0,
    })

    render(<StudentProfilePage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice Student' })).toBeInTheDocument()
    })

    expect(screen.getByText('Student profile')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Saved hostels' })).toHaveAttribute(
      'href',
      '/user/student/student-1/hostels',
    )
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute(
      'href',
      '/user/student/student-1/settings',
    )
  })

  it('shows not found state when user response is null', async () => {
    useParamsMock.mockReturnValue({ userId: 'student-404' })
    usersGetMock.mockResolvedValue(null)

    render(<StudentProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Profile not found.')).toBeInTheDocument()
    })
  })
})

