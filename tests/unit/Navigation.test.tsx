import React from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'

import Navigation, { useNav } from '../../components/Navigation'

const pushMock = jest.fn()
const pathnameMock = jest.fn()
const getAccessTokenMock = jest.fn()
const getStoredEmailMock = jest.fn()
const getStoredFullNameMock = jest.fn()
const getStoredRoleMock = jest.fn()
const getStoredUserIdMock = jest.fn()

jest.mock('next/link', () => jest.requireActual('../helpers/nextMocks').nextLinkModule)

jest.mock('next/navigation', () =>
  jest.requireActual('../helpers/navigationMocks').createNextNavigationModule({
    usePathname: (...args: any[]) => pathnameMock(...args),
    useRouter: () => ({ push: pushMock }),
  }),
)

jest.mock('../../lib/auth', () => ({
  getAccessToken: (...args: any[]) => getAccessTokenMock(...args),
  getStoredEmail: (...args: any[]) => getStoredEmailMock(...args),
  getStoredFullName: (...args: any[]) => getStoredFullNameMock(...args),
  getStoredRole: (...args: any[]) => getStoredRoleMock(...args),
  getStoredUserId: (...args: any[]) => getStoredUserIdMock(...args),
  AUTH_SESSION_CHANGE_EVENT: 'hms-auth-session-change',
}))

describe('Navigation component', () => {
  beforeEach(() => {
    pushMock.mockClear()
    pathnameMock.mockReset()
    getAccessTokenMock.mockReset()
    getStoredEmailMock.mockReset()
    getStoredFullNameMock.mockReset()
    getStoredRoleMock.mockReset()
    getStoredUserIdMock.mockReset()

    pathnameMock.mockReturnValue('/')
    getAccessTokenMock.mockReturnValue(null)
    getStoredEmailMock.mockReturnValue(null)
    getStoredFullNameMock.mockReturnValue(null)
    getStoredRoleMock.mockReturnValue(null)
    getStoredUserIdMock.mockReturnValue(null)
  })

  it('shows login and sign up for guest user', () => {
    render(<Navigation />)

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('navigates to login with encoded next path', () => {
    render(<Navigation />)

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    expect(pushMock).toHaveBeenCalledWith('/login?next=%2F')
  })

  it('renders the primary Find Hostels action when not on hostels page', () => {
    render(<Navigation />)

    expect(screen.getByRole('link', { name: 'Find Hostels' })).toBeInTheDocument()
  })

  it('hides the primary Find Hostels action on the hostels page', () => {
    pathnameMock.mockReturnValue('/hostels')

    render(<Navigation />)

    expect(screen.queryByRole('link', { name: 'Find Hostels' })).not.toBeInTheDocument()
  })

  it('renders stored admin user menu items and signs out', () => {
    getAccessTokenMock.mockReturnValue('token-1')
    getStoredRoleMock.mockReturnValue(2)
    getStoredEmailMock.mockReturnValue('admin@example.com')
    getStoredFullNameMock.mockReturnValue('Admin Person')
    getStoredUserIdMock.mockReturnValue('admin-1')

    render(<Navigation />)

    fireEvent.click(screen.getByText('Admin').closest('button') as HTMLButtonElement)

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hostels' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getAllByText('Administrator')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(pushMock).toHaveBeenCalledWith('/logout')
  })

  it('uses the provided auth callbacks instead of router navigation', () => {
    const onLogin = jest.fn()
    const onSignup = jest.fn()

    render(<Navigation onLogin={onLogin} onSignup={onSignup} />)

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    expect(onLogin).toHaveBeenCalledTimes(1)
    expect(onSignup).toHaveBeenCalledTimes(1)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('can hide all user menu actions', () => {
    render(<Navigation showUserMenu={false} />)

    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument()
  })

  it('opens and closes the mobile guest menu', () => {
    render(<Navigation />)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }))

    expect(screen.getAllByRole('button', { name: 'Login' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Sign Up' })).toHaveLength(2)

    const overlay = Array.from(document.querySelectorAll('div')).find((element) =>
      String(element.className).includes('bg-black/20'),
    ) as HTMLDivElement

    fireEvent.click(overlay)

    expect(screen.getAllByRole('button', { name: 'Login' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Sign Up' })).toHaveLength(1)
  })

  it('renders authenticated hostel owner actions in the mobile menu', () => {
    getAccessTokenMock.mockReturnValue('token-1')
    getStoredRoleMock.mockReturnValue(1)
    getStoredEmailMock.mockReturnValue('owner@example.com')
    getStoredFullNameMock.mockReturnValue('Owner User')
    getStoredUserIdMock.mockReturnValue('owner-1')

    render(<Navigation />)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }))

    expect(screen.getAllByText('Hostel Owner').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /owner/i })).toHaveAttribute(
      'href',
      '/user/owner/owner-1',
    )
    expect(screen.getAllByRole('button', { name: 'Sign Out' }).length).toBeGreaterThan(0)
  })

  it('uses stored full name for the profile display and single-letter avatar', () => {
    getAccessTokenMock.mockReturnValue('token-1')
    getStoredRoleMock.mockReturnValue(1)
    getStoredEmailMock.mockReturnValue('owner@example.com')
    getStoredFullNameMock.mockReturnValue('Owner User')
    getStoredUserIdMock.mockReturnValue('owner-1')

    render(<Navigation />)

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('O')).toBeInTheDocument()
  })
})

describe('useNav', () => {
  it('tracks login and logout state', () => {
    const { result } = renderHook(() => useNav())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.userRole).toBe('guest')

    act(() => {
      result.current.login({
        id: 'student-1',
        name: 'Alice Student',
        email: 'alice@example.com',
        role: 'student',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.userRole).toBe('student')
    expect(result.current.user?.email).toBe('alice@example.com')

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
