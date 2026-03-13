import type { HostelFilters } from '../../../types'
import {
  ApiUserRole,
  ApiHostelStatus,
  ApiHostelVerificationStatus,
  type AmenityReadDto,
  type HostelReadDto,
  type UserReadDto,
} from '../../../types/backend'

export function createBaseFilters(overrides: Partial<HostelFilters> = {}): HostelFilters {
  return {
    priceRange: [0, 50000],
    roomType: [],
    gender: [],
    amenities: [],
    verifiedOnly: false,
    availableOnly: false,
    ...overrides,
  }
}

export function createBaseHostel(overrides: Partial<HostelReadDto> = {}): HostelReadDto {
  return {
    id: '12345678-1234-1234-1234-123456789abc',
    name: 'Sunrise Hostel',
    description: 'Comfortable rooms close to campus',
    city: 'Colombo',
    address: '12 Main Street',
    ownerId: 'owner-1',
    isVerified: true,
    verifiedAt: null,
    verifiedByAdminId: null,
    verificationStatus: ApiHostelVerificationStatus.Approved,
    latitude: 6.9271,
    longitude: 79.8612,
    googleMapsUrl: 'https://maps.example.com',
    minPrice: 10000,
    maxPrice: 15000,
    genderPolicy: 'Mixed',
    images: ['https://example.com/hostel.jpg'],
    status: ApiHostelStatus.Active,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: null,
    ...overrides,
  }
}

export function createBaseUser(overrides: Partial<UserReadDto> = {}): UserReadDto {
  return {
    id: 'user-1',
    fullName: 'Test User',
    email: 'user@example.com',
    phoneNumber: '+94110000000',
    role: ApiUserRole.Student,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: null,
    ...overrides,
  }
}

export function createAmenity(overrides: Partial<AmenityReadDto> = {}): AmenityReadDto {
  return {
    id: 'amenity-1',
    name: 'WiFi',
    ...overrides,
  }
}

export function daysAgoIso(days: number, nowMs = Date.now()): string {
  return new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString()
}

export function createImageFile(name = 'image.jpg', type = 'image/jpeg'): File {
  return new File(['image-bytes'], name, { type })
}
