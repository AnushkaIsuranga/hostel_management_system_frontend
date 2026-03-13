export type AppRole = 'guest' | 'student' | 'owner' | 'admin'

export const AUTH_COOKIES = {
  accessToken: 'hms_access_token',
  userId: 'hms_user_id',
  role: 'hms_user_role',
} as const

export type RouteRule = {
  pattern: RegExp
  roles: AppRole[]
  requireSameUserId?: boolean
  // Which URL segment index contains the userId for requireSameUserId checks
  userIdSegmentIndex?: number
}

export const protectedRoutes: RouteRule[] = [
  // Admin is always protected
  { pattern: /^\/admin(\/|$)/, roles: ['admin'] },

  // Role-specific user pages (enforce correct userId). Must come before the generic /User rule.
  {
    pattern: /^\/user\/student\/(.+?)(\/.*)?$/,
    roles: ['student'],
    requireSameUserId: true,
    userIdSegmentIndex: 2,
  },
  {
    pattern: /^\/user\/owner\/(.+?)(\/.*)?$/,
    roles: ['owner'],
    requireSameUserId: true,
    userIdSegmentIndex: 2,
  },

  // User area: redirect/guard based on role
  { pattern: /^\/user(\/|$)/, roles: ['student', 'owner'] },

  // Authenticated-only utility route
  { pattern: /^\/logout(\/|$)/, roles: ['admin', 'student', 'owner'] },
]

export function roleFromCookie(raw?: string | null): AppRole {
  if (!raw) return 'guest'
  const n = Number(raw)
  if (Number.isFinite(n)) {
    // backend: 0 Student, 1 Owner, 2 Admin
    if (n === 2) return 'admin'
    if (n === 1) return 'owner'
    return 'student'
  }

  // fallback string roles if ever used
  const lowered = raw.toLowerCase()
  if (lowered === 'admin') return 'admin'
  if (lowered === 'owner' || lowered === 'hostel_owner') return 'owner'
  if (lowered === 'student') return 'student'
  return 'guest'
}

export function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some((r) => r.pattern.test(pathname))
}

export function matchProtectedRule(pathname: string): RouteRule | undefined {
  return protectedRoutes.find((r) => r.pattern.test(pathname))
}

export function getPathUserId(pathname: string, segmentIndex: number): string | undefined {
  const parts = pathname.split('/').filter(Boolean)
  return parts[segmentIndex]
}
