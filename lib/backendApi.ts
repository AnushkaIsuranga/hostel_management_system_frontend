import type {
  AmenityCreateDto,
  AmenityReadDto,
  AuthTokensResponseDto,
  HostelAmenityCreateDto,
  HostelAmenityReadDto,
  HostelCreateDto,
  HostelImageReadDto,
  HostelRatingSummaryDto,
  HostelReadDto,
  HostelSearchRequestDto,
  HostelSearchResultDto,
  HostelReviewCreateDto,
  HostelReviewReadDto,
  HostelReviewUpdateDto,
  HostelSubscriptionReadDto,
  HostelVerificationRequestReadDto,
  HostelUpdateDto,
  InteractionEventCreateDto,
  InteractionEventReadDto,
  LoginRequestDto,
  ProblemDetails,
  ReviewVerificationRequestDto,
  StudentPreferenceReadDto,
  StudentPreferenceUpsertDto,
  UserRegisterDto,
  UpsertHostelSubscriptionDto,
  UpdateHostelImageOrderDto,
  UniversityCreateDto,
  UniversityReadDto,
  UniversityUpdateDto,
  UserCreateDto,
  UserReadDto,
  UserUpdateDto,
} from '@/types/backend'
import { getAccessToken } from '@/lib/auth'

const DEFAULT_SERVER_BASE_URL = 'http://localhost:5134/api'
const DEFAULT_BROWSER_BASE_URL = '/api'

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  if (raw && raw.trim()) return raw.trim()

  // In the browser, use same-origin and let Next.js rewrites forward to the backend.
  if (typeof window !== 'undefined') return DEFAULT_BROWSER_BASE_URL

  // Server-side (build/SSR) fallback
  return DEFAULT_SERVER_BASE_URL
}

export class ApiError extends Error {
  status: number
  problem?: ProblemDetails

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

type ApiInit = Omit<RequestInit, 'body'> & {
  json?: unknown
  accessToken?: string
}

async function apiRequest<T>(path: string, init?: ApiInit): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${baseUrl}${normalizedPath}`

  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const token = init?.accessToken ?? getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  })

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get('content-type') ?? ''
  const isJson =
    contentType.includes('application/json') || contentType.includes('application/problem+json')
  const payload: unknown = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null)

  if (!res.ok) {
    const problem = (
      typeof payload === 'object' && payload !== null ? (payload as ProblemDetails) : undefined
    ) as ProblemDetails | undefined
    const message =
      problem?.detail ||
      problem?.title ||
      (typeof payload === 'string' && payload ? payload : `Request failed (${res.status})`)
    throw new ApiError(message, res.status, problem)
  }

  return payload as T
}

export const AuthApi = {
  login: (dto: LoginRequestDto) =>
    apiRequest<AuthTokensResponseDto>('/auth/login', {
      method: 'POST',
      credentials: 'include',
      json: dto,
    }),
  register: (dto: UserRegisterDto) =>
    apiRequest<AuthTokensResponseDto>('/auth/register', {
      method: 'POST',
      credentials: 'include',
      json: dto,
    }),
  refresh: () =>
    apiRequest<AuthTokensResponseDto>('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    }),
  logout: () =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }),
}

export const UsersApi = {
  list: () => apiRequest<UserReadDto[]>('/users', { method: 'GET' }),
  get: (id: string) => apiRequest<UserReadDto>(`/users/${id}`, { method: 'GET' }),
  create: (dto: UserCreateDto) => apiRequest<UserReadDto>('/users', { method: 'POST', json: dto }),
  update: (id: string, dto: UserUpdateDto) =>
    apiRequest<UserReadDto>(`/users/${id}`, { method: 'PUT', json: dto }),
  remove: (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
}

export const HostelsApi = {
  list: () => apiRequest<HostelReadDto[]>('/hostels', { method: 'GET' }),
  get: (id: string) => apiRequest<HostelReadDto>(`/hostels/${id}`, { method: 'GET' }),
  search: (dto: HostelSearchRequestDto) =>
    apiRequest<HostelSearchResultDto[]>('/hostels/search', {
      method: 'POST',
      json: dto,
    }),
  create: (dto: HostelCreateDto) =>
    apiRequest<HostelReadDto>('/hostels', { method: 'POST', json: dto }),
  update: (id: string, dto: HostelUpdateDto) =>
    apiRequest<HostelReadDto>(`/hostels/${id}`, { method: 'PUT', json: dto }),
  remove: (id: string) => apiRequest<void>(`/hostels/${id}`, { method: 'DELETE' }),

  reviews: {
    list: (hostelId: string) =>
      apiRequest<HostelReviewReadDto[]>(`/hostels/${hostelId}/reviews`, { method: 'GET' }),
    summary: (hostelId: string) =>
      apiRequest<HostelRatingSummaryDto>(`/hostels/${hostelId}/reviews/summary`, { method: 'GET' }),
    create: (hostelId: string, dto: HostelReviewCreateDto, accessToken: string) =>
      apiRequest<HostelReviewReadDto>(`/hostels/${hostelId}/reviews`, {
        method: 'POST',
        json: dto,
        accessToken,
      }),
    update: (hostelId: string, reviewId: string, dto: HostelReviewUpdateDto, accessToken: string) =>
      apiRequest<HostelReviewReadDto>(`/hostels/${hostelId}/reviews/${reviewId}`, {
        method: 'PUT',
        json: dto,
        accessToken,
      }),
    remove: (hostelId: string, reviewId: string, accessToken: string) =>
      apiRequest<void>(`/hostels/${hostelId}/reviews/${reviewId}`, {
        method: 'DELETE',
        accessToken,
      }),
  },

  verification: {
    request: (hostelId: string) =>
      apiRequest<void>(`/hostels/${hostelId}/verification/request`, {
        method: 'POST',
      }),
    listRequests: (hostelId: string) =>
      apiRequest<HostelVerificationRequestReadDto[]>(`/hostels/${hostelId}/verification/requests`, {
        method: 'GET',
      }),
  },

  subscription: {
    get: (hostelId: string) =>
      apiRequest<HostelSubscriptionReadDto>(`/hostels/${hostelId}/subscription`, {
        method: 'GET',
      }),
    upsert: (hostelId: string, dto: UpsertHostelSubscriptionDto) =>
      apiRequest<HostelSubscriptionReadDto>(`/hostels/${hostelId}/subscription`, {
        method: 'PUT',
        json: dto,
      }),
  },
}

export const UniversitiesApi = {
  list: () => apiRequest<UniversityReadDto[]>('/universities', { method: 'GET' }),
  get: (id: string) => apiRequest<UniversityReadDto>(`/universities/${id}`, { method: 'GET' }),
  create: (dto: UniversityCreateDto) =>
    apiRequest<UniversityReadDto>('/universities', { method: 'POST', json: dto }),
  update: (id: string, dto: UniversityUpdateDto) =>
    apiRequest<UniversityReadDto>(`/universities/${id}`, { method: 'PUT', json: dto }),
  remove: (id: string) => apiRequest<void>(`/universities/${id}`, { method: 'DELETE' }),
}

export const StudentPreferencesApi = {
  getMe: () => apiRequest<StudentPreferenceReadDto>('/student-preferences/me', { method: 'GET' }),
  upsertMe: (dto: StudentPreferenceUpsertDto, accessToken?: string) =>
    apiRequest<StudentPreferenceReadDto>('/student-preferences/me', {
      method: 'PUT',
      json: dto,
      accessToken,
    }),
}

export const AmenitiesApi = {
  list: () => apiRequest<AmenityReadDto[]>('/amenities', { method: 'GET' }),
  create: (dto: AmenityCreateDto) =>
    apiRequest<AmenityReadDto>('/amenities', { method: 'POST', json: dto }),
}

export const HostelAmenitiesApi = {
  list: () => apiRequest<HostelAmenityReadDto[]>('/hostel-amenities', { method: 'GET' }),
  create: (dto: HostelAmenityCreateDto) =>
    apiRequest<void>('/hostel-amenities', { method: 'POST', json: dto }),
  remove: (hostelId: string, amenityId: string) =>
    apiRequest<void>(`/hostel-amenities/${hostelId}/${amenityId}`, { method: 'DELETE' }),
}

export const VerificationRequestsApi = {
  approve: (requestId: string, dto: ReviewVerificationRequestDto) =>
    apiRequest<void>(`/verification-requests/${requestId}/approve`, {
      method: 'POST',
      json: dto,
    }),
  reject: (requestId: string, dto: ReviewVerificationRequestDto) =>
    apiRequest<void>(`/verification-requests/${requestId}/reject`, {
      method: 'POST',
      json: dto,
    }),
}

export const HostelImagesApi = {
  list: (hostelId: string) =>
    apiRequest<HostelImageReadDto[]>(`/hostelimages/${hostelId}`, { method: 'GET' }),
  upload: async (hostelId: string, file: File, accessToken: string, displayOrder?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    if (displayOrder !== undefined) {
      formData.append('displayOrder', String(displayOrder))
    }

    const proxyAwareBaseUrl = getBaseUrl().replace(/\/$/, '')
    const directUploadBaseUrl =
      (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '') ||
      DEFAULT_SERVER_BASE_URL

    const uploadBaseUrl =
      typeof window !== 'undefined' && proxyAwareBaseUrl.startsWith('/')
        ? directUploadBaseUrl
        : proxyAwareBaseUrl

    const url = `${uploadBaseUrl}/hostelimages/${hostelId}`

    const headers = new Headers()
    headers.set('Accept', 'application/json')
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    const contentType = res.headers.get('content-type') ?? ''
    const isJson =
      contentType.includes('application/json') || contentType.includes('application/problem+json')
    const payload: unknown = isJson
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null)

    if (!res.ok) {
      const problem = (
        typeof payload === 'object' && payload !== null ? (payload as ProblemDetails) : undefined
      ) as ProblemDetails | undefined
      const message =
        problem?.detail ||
        problem?.title ||
        (typeof payload === 'string' && payload ? payload : `Request failed (${res.status})`)
      throw new ApiError(message, res.status, problem)
    }

    return payload as HostelImageReadDto
  },
  remove: (imageId: string, accessToken: string) =>
    apiRequest<void>(`/hostelimages/${imageId}`, {
      method: 'DELETE',
      accessToken,
    }),
  updateOrder: (imageId: string, dto: UpdateHostelImageOrderDto, accessToken: string) =>
    apiRequest<void>(`/hostelimages/${imageId}/order`, {
      method: 'PUT',
      json: dto,
      accessToken,
    }),
}

export const InteractionEventsApi = {
  list: () => apiRequest<InteractionEventReadDto[]>('/interactionevents', { method: 'GET' }),
  get: (id: string) =>
    apiRequest<InteractionEventReadDto>(`/interactionevents/${id}`, { method: 'GET' }),
  create: (dto: InteractionEventCreateDto, accessToken?: string) =>
    apiRequest<InteractionEventReadDto>('/interactionevents', {
      method: 'POST',
      json: dto,
      accessToken,
    }),
  update: (id: string, dto: InteractionEventCreateDto, accessToken?: string) =>
    apiRequest<InteractionEventReadDto>(`/interactionevents/${id}`, {
      method: 'PUT',
      json: dto,
      accessToken,
    }),
  remove: (id: string, accessToken?: string) =>
    apiRequest<void>(`/interactionevents/${id}`, {
      method: 'DELETE',
      accessToken,
    }),
}
