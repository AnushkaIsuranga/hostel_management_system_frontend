import type { AuthTokensResponseDto } from '@/types/backend'

const ACCESS_TOKEN_KEY = 'hms_access_token'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'hms_access_token_expires_at'
const USER_EMAIL_KEY = 'hms_user_email'
const USER_ID_KEY = 'hms_user_id'
const USER_ROLE_KEY = 'hms_user_role'

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
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

export function getAccessToken(): string | undefined {
  if (canUseBrowserStorage()) {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY)
    if (token && token.trim()) return token
  }
  const cookieToken = getCookie(ACCESS_TOKEN_KEY)
  return cookieToken && cookieToken.trim() ? cookieToken : undefined
}

export function setAuthSession(tokens: AuthTokensResponseDto): void {
  if (!canUseBrowserStorage()) return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  window.localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, tokens.accessTokenExpiresAt)
  window.localStorage.setItem(USER_ID_KEY, tokens.userId)
  window.localStorage.setItem(USER_EMAIL_KEY, tokens.email)
  window.localStorage.setItem(USER_ROLE_KEY, String(tokens.role))

  // Mirror minimal session data into cookies so middleware can protect routes.
  // Note: This is not a substitute for server-side auth; it prevents casual URL guessing.
  setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, 7)
  setCookie(USER_ID_KEY, tokens.userId, 7)
  setCookie(USER_ROLE_KEY, String(tokens.role), 7)
}

export function clearAuthSession(): void {
  if (!canUseBrowserStorage()) return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
  window.localStorage.removeItem(USER_ID_KEY)
  window.localStorage.removeItem(USER_EMAIL_KEY)
  window.localStorage.removeItem(USER_ROLE_KEY)

  deleteCookie(ACCESS_TOKEN_KEY)
  deleteCookie(USER_ID_KEY)
  deleteCookie(USER_ROLE_KEY)
}

export function getStoredRole(): number | undefined {
  if (!canUseBrowserStorage()) return undefined
  const raw = window.localStorage.getItem(USER_ROLE_KEY)
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export function getStoredEmail(): string | undefined {
  if (!canUseBrowserStorage()) return undefined
  const email = window.localStorage.getItem(USER_EMAIL_KEY)
  return email && email.trim() ? email : undefined
}

export function getStoredUserId(): string | undefined {
  if (!canUseBrowserStorage()) return undefined
  const id = window.localStorage.getItem(USER_ID_KEY)
  return id && id.trim() ? id : undefined
}
