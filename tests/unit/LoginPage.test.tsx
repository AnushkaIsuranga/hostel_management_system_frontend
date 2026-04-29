import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import LoginPage from '../../app/(auth)/login/page'
import { ApiUserRole, type AuthTokensResponseDto } from '../../types/backend'

const replaceMock = jest.fn()
const loginMock = jest.fn()
const setAuthSessionMock = jest.fn()

jest.mock('next/link', () => jest.requireActual('../helpers/nextMocks').nextLinkModule)

jest.mock('next/navigation', () =>
  jest.requireActual('../helpers/navigationMocks').createNextNavigationModule({
    useRouter: () => ({ replace: replaceMock }),
  }),
)

jest.mock('../../lib/backendApi', () => ({
  AuthApi: {
    login: (...args: any[]) => loginMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  setAuthSession: (...args: any[]) => setAuthSessionMock(...args),
}))

describe('LoginPage', () => {
  const baseTokens: AuthTokensResponseDto = {
    accessToken: 'token',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    userId: 'user-1',
    email: 'user@example.com',
    role: ApiUserRole.Student,
  }

  beforeEach(() => {
    replaceMock.mockReset()
    loginMock.mockReset()
    setAuthSessionMock.mockReset()
    window.history.pushState({}, '', '/login')
  })

  it('submits credentials, stores session, and redirects to hostels for non-admin', async () => {
    loginMock.mockResolvedValue(baseTokens)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Pass123!',
        rememberMe: true,
      })
    })

    expect(setAuthSessionMock).toHaveBeenCalledWith(baseTokens, { persistent: true })
    expect(replaceMock).toHaveBeenCalledWith('/hostels')
  })

  it('redirects admin users to admin dashboard', async () => {
    loginMock.mockResolvedValue({ ...baseTokens, role: ApiUserRole.Admin })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(setAuthSessionMock).toHaveBeenCalledWith(
        expect.objectContaining({ role: ApiUserRole.Admin }),
        { persistent: false },
      )
      expect(replaceMock).toHaveBeenCalledWith('/admin')
    })
  })

  it('stores a session-only login when remember me is unchecked', async () => {
    loginMock.mockResolvedValue(baseTokens)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass123!' } })
    fireEvent.click(screen.getByLabelText('Remember me'))
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(setAuthSessionMock).toHaveBeenCalledWith(baseTokens, { persistent: false })
    })
  })

  it('uses safe next query path when provided', async () => {
    loginMock.mockResolvedValue(baseTokens)
    window.history.pushState({}, '', '/login?next=%2Fuser%2Fsettings')

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/user/settings')
    })
  })

  it('shows error message when login fails', async () => {
    loginMock.mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Sign in failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})
