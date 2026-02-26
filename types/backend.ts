// Backend DTOs (http://localhost:5134/api)

export type Guid = string

// Enums are serialized as integers by the backend
export enum ApiUserRole {
  Student = 0,
  Owner = 1,
  Admin = 2,
}

export enum ApiHostelStatus {
  Pending = 0,
  Active = 1,
  Disabled = 2,
}

export enum ApiHostelVerificationStatus {
  None = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Expired = 4,
}

export enum ApiListingStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum ApiInteractionType {
  ViewHostel = 0,
  Search = 1,
  FilterApply = 2,
  Save = 3,
  ContactOwner = 4,
  BookAttempt = 5,
  BookSuccess = 6,
}

export type ProblemDetails = {
  status?: number
  title?: string
  detail?: string
  instance?: string
  errorCode?: string
  errors?: Record<string, string[]>
}

export type LoginRequestDto = {
  email: string
  password: string
  rememberMe?: boolean
}

export type AuthTokensResponseDto = {
  accessToken: string
  accessTokenExpiresAt: string
  userId: Guid
  email: string
  role: ApiUserRole
}

export type UserReadDto = {
  id: Guid
  fullName: string
  email: string
  phoneNumber: string
  role: ApiUserRole
  createdAt: string
  updatedAt: string | null
}

export type UserCreateDto = {
  fullName: string
  email: string
  phoneNumber: string
  role: ApiUserRole
}

export type UserUpdateDto = {
  fullName: string
  phoneNumber: string
  role: ApiUserRole
}

export type HostelReadDto = {
  id: Guid
  name: string
  description: string
  city: string
  address: string
  ownerId: Guid
  isVerified: boolean
  verifiedAt: string | null
  verifiedByAdminId: Guid | null
  verificationStatus: ApiHostelVerificationStatus
  minPrice: number
  maxPrice: number
  genderPolicy: string
  locationUrl: string
  images: string[]
  status: ApiHostelStatus
  createdAt: string
  updatedAt: string | null
}

export type HostelCreateDto = {
  name: string
  description: string
  city: string
  address: string
  ownerId: Guid
  minPrice: number
  maxPrice: number
  genderPolicy: string
  locationUrl: string
  images?: string[]
  status: ApiHostelStatus
}

export type HostelUpdateDto = HostelCreateDto

export type HostelVerificationRequestReadDto = {
  id: Guid
  hostelId: Guid
  requestedByUserId: Guid
  status: number
  adminNotes: string | null
  reviewedByAdminId: Guid | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type ReviewVerificationRequestDto = {
  adminNotes: string | null
}

export type HostelSubscriptionReadDto = {
  hostelId: Guid
  startDate: string
  expiryDate: string
  isActive: boolean
  lastReminderSentAt: string | null
}

export type UpsertHostelSubscriptionDto = {
  startDate: string
  expiryDate: string
}

export type HostelReviewReadDto = {
  id: Guid
  hostelId: Guid
  userId: Guid
  userFullName: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string | null
}

export type HostelReviewCreateDto = {
  rating: number
  comment: string | null
}

export type HostelReviewUpdateDto = {
  rating: number
  comment: string | null
}

export type HostelRatingSummaryDto = {
  hostelId: Guid
  averageRating: number
  reviewCount: number
}

export type HostelImageReadDto = {
  id: Guid
  hostelId: Guid
  fileName: string
  contentType: string
  fileSize: number
  imageUrl: string
  displayOrder: number
  createdAt: string
}

export type UpdateHostelImageOrderDto = {
  displayOrder: number
}
