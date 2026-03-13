import { NextResponse, type NextRequest } from 'next/server'

import {
  AUTH_COOKIES,
  getPathUserId,
  isProtectedPath,
  matchProtectedRule,
  roleFromCookie,
} from './rolePermissions'

function isPublicAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/images')
  )
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicAsset(pathname)) {
    return NextResponse.next()
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const accessToken = req.cookies.get(AUTH_COOKIES.accessToken)?.value
  const roleCookie = req.cookies.get(AUTH_COOKIES.role)?.value
  const userIdCookie = req.cookies.get(AUTH_COOKIES.userId)?.value

  const role = roleFromCookie(roleCookie)
  const isLoggedIn = Boolean(accessToken)

  // If unauthenticated, force login for protected paths
  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Special case: /user should redirect non-admins to their own profile
  if (pathname === '/user' || pathname === '/user/') {
    if (role === 'admin') return NextResponse.next()

    if (!userIdCookie) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const target =
      role === 'owner' ? `/user/owner/${userIdCookie}` : `/user/student/${userIdCookie}`
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = target
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  const rule = matchProtectedRule(pathname)
  if (!rule) return NextResponse.next()

  // Role check (admins only where specified)
  if (!rule.roles.includes(role)) {
    const fallback = req.nextUrl.clone()
    fallback.pathname = '/hostels'
    fallback.search = ''
    return NextResponse.redirect(fallback)
  }

  // Enforce same-user access for student/owner profile pages
  if (rule.requireSameUserId && typeof rule.userIdSegmentIndex === 'number') {
    const pathUserId = getPathUserId(pathname, rule.userIdSegmentIndex)
    if (pathUserId && userIdCookie && pathUserId !== userIdCookie) {
      const fallback = req.nextUrl.clone()
      fallback.pathname = '/hostels'
      fallback.search = ''
      return NextResponse.redirect(fallback)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api).*)'],
}