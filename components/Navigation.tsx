'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import type { NavItem, NavProps, User, UserRole } from '../types'
import { getAccessToken, getStoredEmail, getStoredRole } from '@/lib/auth'

const defaultUser: User = {
  id: 'guest-1',
  name: 'Guest',
  email: 'guest@example.com',
  role: 'guest',
}

// Navigation items based on roles
const navItems: NavItem[] = [
  {
    name: 'Find Hostels',
    href: '/hostels',
    roles: ['guest', 'student', 'hostel_owner', 'admin'],
    isPrimary: true,
  },
]

const userMenuItems: Record<UserRole, NavItem[]> = {
  student: [{ name: 'Users', href: '/user', roles: ['student'] }],
  hostel_owner: [{ name: 'Users', href: '/user', roles: ['hostel_owner'] }],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', roles: ['admin'] },
    { name: 'Hostels', href: '/admin/hostels', roles: ['admin'] },
    { name: 'Users', href: '/admin/users', roles: ['admin'] },
  ],
  guest: [],
}

export default function Navigation({
  currentUser,
  onLogin,
  onLogout,
  onSignup,
  className = '',
  showUserMenu = true,
}: NavProps) {
  const router = useRouter()
  const [internalUser, setInternalUser] = useState<User>(() => {
    const token = getAccessToken()
    if (!token) return defaultUser

    const roleNum = getStoredRole()
    const role: UserRole = roleNum === 2 ? 'admin' : roleNum === 1 ? 'hostel_owner' : 'student'

    const email = getStoredEmail() ?? 'user@example.com'
    const name = email.includes('@') ? email.split('@')[0] : email

    return {
      ...defaultUser,
      id: 'session',
      name,
      email,
      role,
    }
  })

  const effectiveUser = currentUser ?? internalUser

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const isHostelsPage = pathname.startsWith('/hostels')

  const nextPath = useMemo(() => {
    const p = pathname || '/'
    return encodeURIComponent(p)
  }, [pathname])

  const handleLogin =
    onLogin ??
    (() => {
      router.push(`/login?next=${nextPath}`)
    })

  const handleSignup =
    onSignup ??
    (() => {
      router.push(`/signup?next=${nextPath}`)
    })

  const handleLogout =
    onLogout ??
    (() => {
      setInternalUser(defaultUser)
      router.push('/logout')
    })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Close mobile menu on route change
    const t = setTimeout(() => {
      setIsMenuOpen(false)
      setIsUserMenuOpen(false)
    }, 0)

    return () => clearTimeout(t)
  }, [pathname])

  const filteredNavItems = navItems.filter((item) => item.roles.includes(effectiveUser.role))
  const currentUserMenuItems = userMenuItems[effectiveUser.role] || []
  const isAuthenticated = effectiveUser.role !== 'guest'

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'student':
        return 'bg-blue-500'
      case 'hostel_owner':
        return 'bg-green-500'
      case 'admin':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'student':
        return 'Student'
      case 'hostel_owner':
        return 'Hostel Owner'
      case 'admin':
        return 'Administrator'
      default:
        return 'Guest'
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled || isMenuOpen ? 'bg-white/95 shadow-md backdrop-blur-md' : 'bg-transparent'
        } ${className}`}
      >
        <div className="mx-auto max-w-5/6 px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-700">
                <span className="text-xl font-bold text-white">H</span>
              </div>
              <span className="text-2xl font-bold text-amber-800">UniHostel</span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {filteredNavItems
                .filter((item) => !item.isPrimary)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-amber-700 ${
                      pathname === item.href ? 'bg-amber-50 font-semibold text-amber-700' : ''
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

              {filteredNavItems
                .filter((item) => item.isPrimary && !isHostelsPage)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="accent-btn rounded-xl px-6 py-2.5 font-semibold"
                  >
                    {item.name}
                  </Link>
                ))}

              {showUserMenu && (
                <div className="relative ml-4">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100"
                      >
                        <div className="relative">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white ${getRoleColor(
                              effectiveUser.role,
                            )}`}
                          >
                            {effectiveUser.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={effectiveUser.avatar}
                                alt={effectiveUser.name}
                                className="h-full w-full rounded-full"
                              />
                            ) : (
                              getInitials(effectiveUser.name)
                            )}
                          </div>
                          <div
                            className={`absolute -right-1 -bottom-1 h-4 w-4 ${getRoleColor(
                              effectiveUser.role,
                            )} rounded-full border-2 border-white`}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{effectiveUser.name}</p>
                          <p className="text-xs text-gray-500">
                            {getRoleLabel(effectiveUser.role)}
                          </p>
                        </div>
                      </button>

                      {isUserMenuOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                          <div className="border-b border-gray-100 px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {effectiveUser.name}
                            </p>
                            <p className="text-xs text-gray-500">{effectiveUser.email}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {getRoleLabel(effectiveUser.role)}
                            </p>
                          </div>

                          {currentUserMenuItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
                            >
                              {item.name}
                            </Link>
                          ))}

                          <div className="mt-2 border-t border-gray-100 pt-2">
                            <button
                              onClick={handleLogout}
                              className="block w-full px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleLogin}
                        className="px-6 py-2.5 font-medium text-gray-700 transition-colors hover:text-amber-700"
                      >
                        Login
                      </button>
                      <button
                        onClick={handleSignup}
                        className="accent-btn rounded-xl px-6 py-2.5 font-semibold"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="p-2 md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="flex h-5 w-6 flex-col justify-between">
                <span
                  className={`h-0.5 w-full bg-gray-800 transition-all ${
                    isMenuOpen ? 'translate-y-2 rotate-45' : ''
                  }`}
                ></span>
                <span
                  className={`h-0.5 w-full bg-gray-800 transition-all ${isMenuOpen ? 'opacity-0' : ''}`}
                ></span>
                <span
                  className={`h-0.5 w-full bg-gray-800 transition-all ${
                    isMenuOpen ? '-translate-y-2 -rotate-45' : ''
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-x-0 top-20 z-40 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-amber-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-4">
            {filteredNavItems
              .filter((item) => !item.isPrimary)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-700 ${
                    pathname === item.href ? 'bg-amber-50 font-semibold text-amber-700' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}

            {filteredNavItems
              .filter((item) => item.isPrimary && !isHostelsPage)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="accent-btn mt-4 block px-6 py-3.5 text-center font-semibold"
                >
                  {item.name}
                </Link>
              ))}

            {showUserMenu && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white ${getRoleColor(
                          effectiveUser.role,
                        )}`}
                      >
                        {effectiveUser.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={effectiveUser.avatar}
                            alt={effectiveUser.name}
                            className="h-full w-full rounded-full"
                          />
                        ) : (
                          getInitials(effectiveUser.name)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{effectiveUser.name}</p>
                        <p className="text-sm text-gray-500">{getRoleLabel(effectiveUser.role)}</p>
                      </div>
                    </div>

                    {currentUserMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
                      >
                        {item.name}
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="mt-2 block w-full rounded-lg px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="block w-full rounded-lg px-4 py-3 text-center text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleSignup}
                      className="accent-btn mt-2 block w-full px-6 py-3.5 text-center font-semibold"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}

export function useNav() {
  const [user, setUser] = useState<User | null>(null)

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
  }

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    userRole: user?.role || 'guest',
  }
}
