import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import LogoutPage from '../../app/(auth)/logout/page'

const replaceMock = jest.fn()
const logoutMock = jest.fn()
const clearAuthSessionMock = jest.fn()
const routerMock = { replace: replaceMock }

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  AuthApi: {
    logout: (...args: any[]) => logoutMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  clearAuthSession: (...args: any[]) => clearAuthSessionMock(...args),
}))

describe('LogoutPage', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    logoutMock.mockReset()
    clearAuthSessionMock.mockReset()
  })

  it('logs out, clears session, and redirects home', async () => {
    logoutMock.mockResolvedValue(undefined)

    render(<LogoutPage />)

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1)
      expect(clearAuthSessionMock).toHaveBeenCalledTimes(1)
      expect(replaceMock).toHaveBeenCalledWith('/')
    })
  })

  it('shows error when logout fails and still redirects after clearing session', async () => {
    logoutMock.mockRejectedValue(new Error('Network issue'))

    render(<LogoutPage />)

    await waitFor(() => {
      expect(screen.getByText('Sign out failed')).toBeInTheDocument()
      expect(screen.getByText('Network issue')).toBeInTheDocument()
    })

    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith('/')
  })
})

