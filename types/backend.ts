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
}

export type InteractionEventCreateDto = {
  userId?: Guid | null
  hostelId?: Guid | null
  eventType: ApiInteractionType
  interactionType?: ApiInteractionType
  sessionId?: string | null
  metadata?: Record<string, unknown> | null
}

export type InteractionEventReadDto = {
  id: Guid
  userId: Guid | null
  hostelId: Guid | null
  eventType: ApiInteractionType
  sessionId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
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

export type UserRegisterDto = {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  role?: ApiUserRole
  questionnaire?: SignupQuestionnaireDto | null
}

export type SignupQuestionnaireDto = {
  universityId?: Guid | null
  minBudget?: number | null
  maxBudget?: number | null
  requiredCapacity?: number | null
  amenities?: string[] | null
  priceWeight?: number | null
  distanceWeight?: number | null
  ratingWeight?: number | null
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
  latitude: number
  longitude: number
  googleMapsUrl: string
  minPrice: number
  maxPrice: number
  genderPolicy: string
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
  ownerId?: Guid
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  minPrice: number
  maxPrice: number
  genderPolicy: string
  images?: string[]
  status: ApiHostelStatus
}

export type HostelUpdateDto = Omit<HostelCreateDto, 'ownerId'> & {
  ownerId: Guid
}

export type UniversityReadDto = {
  id: Guid
  name: string
  latitude: number
  longitude: number
}

export type UniversityCreateDto = {
  name: string
  latitude?: number
  longitude?: number
  locationUrl?: string | null
}

export type UniversityUpdateDto = UniversityCreateDto

export type AmenityReadDto = {
  id: Guid
  name: string
}

export type AmenityCreateDto = {
  name: string
}

export type HostelAmenityCreateDto = {
  hostelId: Guid
  amenityId: Guid
}

export type HostelAmenityReadDto = {
  hostelId: Guid
  amenityId: Guid
}

export type HostelSearchWeightsDto = {
  priceWeight?: number
  distanceWeight?: number
  ratingWeight?: number
}

export type HostelSearchRequestDto = {
  universityId?: Guid | null
  minBudget?: number | null
  maxBudget?: number | null
  requiredCapacity?: number | null
  genderPolicy?: string | null
  amenityIds?: Guid[] | null
  amenities?: string[] | null
  maxDistanceKm?: number | null
  weights?: HostelSearchWeightsDto | null
}

export type StudentPreferenceWeightsDto = {
  price: number
  distance: number
  rating: number
}

export type StudentPreferenceUpsertDto = {
  universityId: Guid
  minBudget?: number | null
  maxBudget?: number | null
  requiredCapacity?: number | null
  selectedAmenities?: string[] | null
  priorityOrder?: ('price' | 'distance' | 'rating')[] | null
  weights?: StudentPreferenceWeightsDto | null
}

export type StudentPreferenceReadDto = {
  userId: Guid
  universityId: Guid
  minBudget: number | null
  maxBudget: number | null
  requiredCapacity: number | null
  selectedAmenities: string[]
  priorityOrder: ('price' | 'distance' | 'rating')[]
  weights: StudentPreferenceWeightsDto
  createdAt: string
  updatedAt: string | null
}

export type HostelSearchResultDto = {
  hostel: HostelReadDto
  distanceKm: number
  score: number
}

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
