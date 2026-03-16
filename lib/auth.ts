import type { AuthTokensResponseDto } from '@/types/backend'

const ACCESS_TOKEN_KEY = 'hms_access_token'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'hms_access_token_expires_at'
const USER_EMAIL_KEY = 'hms_user_email'
const USER_ID_KEY = 'hms_user_id'
const USER_ROLE_KEY = 'hms_user_role'
const AUTH_STORAGE_KEYS = [
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_EXPIRES_AT_KEY,
  USER_EMAIL_KEY,
  USER_ID_KEY,
  USER_ROLE_KEY,
] as const

export const AUTH_SESSION_CHANGE_EVENT = 'hms-auth-session-change'

type AuthStorageMode = 'persistent' | 'session'

type SetAuthSessionOptions = {
  persistent?: boolean
}

type StoredAuthSession = {
  accessToken?: string
  accessTokenExpiresAt?: string
  email?: string
  userId?: string
  role?: string
}

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function canUseDocumentCookies(): boolean {
  return typeof document !== 'undefined' && typeof document.cookie === 'string'
}

function setCookie(name: string, value: string, days?: number): void {
  if (!canUseDocumentCookies()) return
  const encoded = encodeURIComponent(value)
  const expires =
    typeof days === 'number'
      ? `; Expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()}`
      : ''
  document.cookie = `${name}=${encoded}${expires}; Path=/; SameSite=Lax`
}

function deleteCookie(name: string): void {
  if (!canUseDocumentCookies()) return
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`
}

function getCookie(name: string): string | undefined {
  if (!canUseDocumentCookies()) return undefined
  const cookies = document.cookie.split(';').map((c) => c.trim())
  for (const c of cookies) {
    if (!c) continue
    const idx = c.indexOf('=')
    if (idx < 0) continue
    const k = c.slice(0, idx)
    if (k === name) return decodeURIComponent(c.slice(idx + 1))
  }
  return undefined
}

function isAdminRole(role: string | number): boolean {
  return role === 2 || String(role).trim().toLowerCase() === 'admin'
}

function emitAuthSessionChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT))
}

function removeAuthItems(storage: Storage): void {
  AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key))
}

function clearStoredAuthData(): void {
  if (canUseBrowserStorage()) {
    removeAuthItems(window.localStorage)
  }
  if (canUseSessionStorage()) {
    removeAuthItems(window.sessionStorage)
  }
}

function readStoredAuthSession(): StoredAuthSession {
  if (canUseSessionStorage()) {
    const accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined
    if (accessToken && accessToken.trim()) {
      return {
        accessToken,
        accessTokenExpiresAt:
          window.sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY) ?? undefined,
        email: window.sessionStorage.getItem(USER_EMAIL_KEY) ?? undefined,
        userId: window.sessionStorage.getItem(USER_ID_KEY) ?? undefined,
        role: window.sessionStorage.getItem(USER_ROLE_KEY) ?? undefined,
      }
    }
  }

  if (canUseBrowserStorage()) {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined
    if (accessToken && accessToken.trim()) {
      return {
        accessToken,
        accessTokenExpiresAt: window.localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY) ?? undefined,
        email: window.localStorage.getItem(USER_EMAIL_KEY) ?? undefined,
        userId: window.localStorage.getItem(USER_ID_KEY) ?? undefined,
        role: window.localStorage.getItem(USER_ROLE_KEY) ?? undefined,
      }
    }
  }

  return {}
}

function hasExpiredAuthSession(accessTokenExpiresAt?: string): boolean {
  if (!accessTokenExpiresAt || !accessTokenExpiresAt.trim()) return false
  const expiresAtMs = Date.parse(accessTokenExpiresAt)
  if (Number.isNaN(expiresAtMs)) return false
  return expiresAtMs <= Date.now()
}

function getValidatedStoredAuthSession(): StoredAuthSession {
  const session = readStoredAuthSession()
  if (!session.accessToken) {
    return session
  }

  if (hasExpiredAuthSession(session.accessTokenExpiresAt)) {
    clearAuthSession()
    return {}
  }

  return session
}

export function getAccessToken(): string | undefined {
  const storedSession = getValidatedStoredAuthSession()
  if (storedSession.accessToken && storedSession.accessToken.trim()) {
    return storedSession.accessToken
  }

  const cookieToken = getCookie(ACCESS_TOKEN_KEY)
  return cookieToken && cookieToken.trim() ? cookieToken : undefined
}

export function setAuthSession(
  tokens: AuthTokensResponseDto,
  options?: SetAuthSessionOptions,
): void {
  const persistent = options?.persistent ?? !isAdminRole(tokens.role)
  const storageMode: AuthStorageMode = persistent ? 'persistent' : 'session'
  const storage =
    storageMode === 'persistent'
      ? canUseBrowserStorage()
        ? window.localStorage
        : undefined
      : canUseSessionStorage()
        ? window.sessionStorage
        : undefined

  clearStoredAuthData()
  deleteCookie(ACCESS_TOKEN_KEY)
  deleteCookie(USER_ID_KEY)
  deleteCookie(USER_ROLE_KEY)

  if (storage) {
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    storage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, tokens.accessTokenExpiresAt)
    storage.setItem(USER_ID_KEY, tokens.userId)
    storage.setItem(USER_EMAIL_KEY, tokens.email)
    storage.setItem(USER_ROLE_KEY, String(tokens.role))
  }

  // Mirror minimal session data into cookies so middleware can protect routes.
  // Note: This is not a substitute for server-side auth; it prevents casual URL guessing.
  setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, persistent ? 7 : undefined)
  setCookie(USER_ID_KEY, tokens.userId, persistent ? 7 : undefined)
  setCookie(USER_ROLE_KEY, String(tokens.role), persistent ? 7 : undefined)

  emitAuthSessionChange()
}

export function clearAuthSession(): void {
  clearStoredAuthData()

  deleteCookie(ACCESS_TOKEN_KEY)
  deleteCookie(USER_ID_KEY)
  deleteCookie(USER_ROLE_KEY)

  emitAuthSessionChange()
}

export function getStoredRole(): number | undefined {
  const raw = getValidatedStoredAuthSession().role
  if (!raw) return undefined

  const normalized = raw.trim().toLowerCase()
  if (normalized === 'admin') return 2
  if (normalized === 'owner' || normalized === 'hostel_owner') return 1
  if (normalized === 'student') return 0

  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export function getStoredEmail(): string | undefined {
  const email = getValidatedStoredAuthSession().email
  return email && email.trim() ? email : undefined
}

export function getStoredUserId(): string | undefined {
  const id = getValidatedStoredAuthSession().userId
  return id && id.trim() ? id : undefined
}
