import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import SignupPage from '../../app/(auth)/signup/page'
import { ApiUserRole, type AuthTokensResponseDto } from '../../types/backend'

const pushMock = jest.fn()
const replaceMock = jest.fn()
const registerMock = jest.fn()
const setAuthSessionMock = jest.fn()
const routerMock = { push: pushMock, replace: replaceMock }

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  AuthApi: {
    register: (...args: any[]) => registerMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  setAuthSession: (...args: any[]) => setAuthSessionMock(...args),
}))

jest.mock('../../components/auth/AccountFields', () => {
  return function MockAccountFields(props: any) {
    return (
      <div>
        <button type="button" onClick={() => props.onRoleChange(0)}>
          Student
        </button>
        <button type="button" onClick={() => props.onRoleChange(1)}>
          Owner
        </button>
        <label>
          Full name
          <input
            aria-label="Full name"
            value={props.fullName}
            onChange={(e) => props.onFullNameChange(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            aria-label="Email"
            value={props.email}
            onChange={(e) => props.onEmailChange(e.target.value)}
          />
        </label>
        <label>
          Phone number
          <input
            aria-label="Phone number"
            value={props.phoneNumber}
            onChange={(e) => props.onPhoneNumberChange(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            aria-label="Password"
            value={props.password}
            onChange={(e) => props.onPasswordChange(e.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            aria-label="Confirm password"
            value={props.confirmPassword}
            onChange={(e) => props.onConfirmPasswordChange(e.target.value)}
          />
        </label>
      </div>
    )
  }
})

describe('SignupPage', () => {
  const baseTokens: AuthTokensResponseDto = {
    accessToken: 'token-1',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    userId: 'user-1',
    email: 'owner@example.com',
    role: ApiUserRole.Owner,
  }

  function fillValidAccountFields() {
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+94771234567' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Strong1!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Strong1!' } })
  }

  beforeEach(() => {
    pushMock.mockReset()
    replaceMock.mockReset()
    registerMock.mockReset()
    setAuthSessionMock.mockReset()
    sessionStorage.clear()
    window.history.pushState({}, '', '/signup')
  })

  it('for student role stores partial signup and navigates to onboarding', async () => {
    render(<SignupPage />)

    fillValidAccountFields()

    const nextButton = screen.getByRole('button', { name: 'Next' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/signup/onboarding')
    })

    const saved = sessionStorage.getItem('signup_partial')
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved as string)).toEqual(
      expect.objectContaining({
        selectedRole: ApiUserRole.Student,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '+94771234567',
        password: 'Strong1!',
      }),
    )
  })

  it('for owner role registers, stores auth, and redirects to hostels', async () => {
    registerMock.mockResolvedValue(baseTokens)

    render(<SignupPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Owner' }))
    fillValidAccountFields()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '+94771234567',
        password: 'Strong1!',
        role: ApiUserRole.Owner,
      })
    })

    expect(setAuthSessionMock).toHaveBeenCalledWith(baseTokens)
    expect(replaceMock).toHaveBeenCalledWith('/hostels')
  })

  it('shows error message when register fails', async () => {
    registerMock.mockRejectedValue(new Error('Signup failed from api'))

    render(<SignupPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Owner' }))
    fillValidAccountFields()
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Sign up failed')).toBeInTheDocument()
      expect(screen.getByText('Signup failed from api')).toBeInTheDocument()
    })
  })
})

