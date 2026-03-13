import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import OnboardingPage from '../../app/(auth)/signup/onboarding/page'
import { ApiUserRole, type AuthTokensResponseDto } from '../../types/backend'

const pushMock = jest.fn()
const replaceMock = jest.fn()
const universitiesListMock = jest.fn()
const amenitiesListMock = jest.fn()
const registerMock = jest.fn()
const upsertMeMock = jest.fn()
const setAuthSessionMock = jest.fn()
const routerMock = { push: pushMock, replace: replaceMock }

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  UniversitiesApi: {
    list: (...args: any[]) => universitiesListMock(...args),
  },
  AmenitiesApi: {
    list: (...args: any[]) => amenitiesListMock(...args),
  },
  AuthApi: {
    register: (...args: any[]) => registerMock(...args),
  },
  StudentPreferencesApi: {
    upsertMe: (...args: any[]) => upsertMeMock(...args),
  },
}))

jest.mock('../../lib/auth', () => ({
  setAuthSession: (...args: any[]) => setAuthSessionMock(...args),
}))

jest.mock('../../components/auth/StudentPreferencesFields', () => {
  return function MockStudentPreferencesFields(props: any) {
    return (
      <div>
        <button type="button" onClick={() => props.onUniversityChange('uni-1')}>
          Choose University
        </button>
      </div>
    )
  }
})

describe('OnboardingPage', () => {
  const studentPartial = {
    selectedRole: ApiUserRole.Student,
    fullName: 'Jane Student',
    email: 'jane.student@example.com',
    phoneNumber: '+94771234567',
    password: 'Strong1!',
  }

  const baseTokens: AuthTokensResponseDto = {
    accessToken: 'token-student',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    userId: 'student-1',
    email: 'jane.student@example.com',
    role: ApiUserRole.Student,
  }

  beforeEach(() => {
    pushMock.mockReset()
    replaceMock.mockReset()
    universitiesListMock.mockReset()
    amenitiesListMock.mockReset()
    registerMock.mockReset()
    upsertMeMock.mockReset()
    setAuthSessionMock.mockReset()
    sessionStorage.clear()

    universitiesListMock.mockResolvedValue([{ id: 'uni-1', name: 'University A' }])
    amenitiesListMock.mockResolvedValue([{ id: 'amenity-1', name: 'WiFi' }])

    window.history.pushState({}, '', '/signup/onboarding')
  })

  it('redirects to signup when no partial signup exists', async () => {
    render(<OnboardingPage />)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/signup')
    })
  })

  it('requires university selection before submit', async () => {
    sessionStorage.setItem('signup_partial', JSON.stringify(studentPartial))

    render(<OnboardingPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Onboarding failed')).toBeInTheDocument()
      expect(screen.getByText('Select a university to continue.')).toBeInTheDocument()
    })

    expect(registerMock).not.toHaveBeenCalled()
  })

  it('registers student, saves preferences, and redirects to hostels', async () => {
    sessionStorage.setItem('signup_partial', JSON.stringify(studentPartial))
    registerMock.mockResolvedValue(baseTokens)
    upsertMeMock.mockResolvedValue({})

    render(<OnboardingPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose University' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        fullName: 'Jane Student',
        email: 'jane.student@example.com',
        phoneNumber: '+94771234567',
        password: 'Strong1!',
        role: ApiUserRole.Student,
      })
    })

    expect(setAuthSessionMock).toHaveBeenCalledWith(baseTokens)
    expect(upsertMeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        universityId: 'uni-1',
        priorityOrder: ['price', 'distance', 'rating'],
        weights: { price: 0.5, distance: 0.3, rating: 0.2 },
      }),
      'token-student',
    )
    expect(sessionStorage.getItem('signup_partial')).toBeNull()
    expect(replaceMock).toHaveBeenCalledWith('/hostels')
  })
})

