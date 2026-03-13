import type { ReactNode } from 'react'

// -----------------------------
// Navigation
// -----------------------------

// User and Auth Types
export type UserRole = 'guest' | 'student' | 'hostel_owner' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  university?: string // for students
}

// Navigation Types
export interface NavItem {
  name: string
  href: string
  roles: UserRole[]
  isPrimary?: boolean
}

export interface NavProps {
  currentUser?: User
  onLogin?: () => void
  onLogout?: () => void
  onSignup?: () => void
  className?: string
  showUserMenu?: boolean
}

// Hostel Types
export interface Hostel {
  id: string
  name: string
  description: string
  address: string
  city: string
  university: string
  distanceFromUniversity: number // in km

  // Pricing
  monthlyRent: number
  securityDeposit: number
  utilitiesIncluded: boolean

  // Room details
  roomType: 'single' | 'double' | 'triple' | 'shared'
  totalRooms: number
  availableRooms: number

  // Amenities
  amenities: string[]

  // Details
  gender: 'male' | 'female' | 'mixed'
  verified: boolean
  rating: number
  reviewCount: number

  // Media
  images: string[]
  virtualTour?: string

  // Owner
  ownerId: string
  ownerName: string
  ownerPhone: string

  // Additional
  rules?: string[]
  facilities?: string[]
  createdAt: Date
  updatedAt: Date
}

// Filter Types
export interface HostelFilters {
  university?: string
  city?: string
  priceRange: [number, number]
  roomType?: ('single' | 'double' | 'triple' | 'shared')[]
  gender?: ('male' | 'female' | 'mixed')[]
  amenities?: string[]
  verifiedOnly: boolean
  availableOnly: boolean
  maxDistance?: number // in km from university
  minRating?: number
}

// Search and Sort Types
export type SortOption =
  | 'price-low-to-high'
  | 'price-high-to-low'
  | 'rating-high-to-low'
  | 'distance-low-to-high'
  | 'newest-first'

export interface SearchParams {
  query?: string
  filters: HostelFilters
  sortBy: SortOption
  page: number
  perPage: number
}

// -----------------------------
// Landing page
// -----------------------------

export type Feature = {
  icon: ReactNode
  title: string
  description: string
}

export type Testimonial = {
  name: string
  university: string
  text: string
  avatar: string
}

export type Stat = {
  number: string
  label: string
}

// -----------------------------
// Animations
// -----------------------------

export type AnimatedDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right'

export interface AnimatedElementProps {
  children: ReactNode
  direction?: AnimatedDirection
  delay?: number
  duration?: number
  distance?: number
  easing?: string
  threshold?: number
  className?: string
  startVisible?: boolean
  triggerOnce?: boolean
  fadeIn?: boolean
  scale?: boolean
  scaleFrom?: number
  rotate?: boolean
  rotateFrom?: number
  blur?: boolean
  blurAmount?: number
}

export interface AnimationSequenceProps {
  children: ReactNode
  direction?: AnimatedDirection
  baseDelay?: number
  staggerDelay?: number
  duration?: number
  distance?: number
  easing?: string
  className?: string
  triggerOnce?: boolean
}

export type ParallaxDirection = 'vertical' | 'horizontal' | 'diagonal'
export type ParallaxEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export interface ParallaxElementProps {
  children: ReactNode
  speed?: number
  direction?: ParallaxDirection
  scale?: boolean
  scaleRange?: [number, number]
  rotate?: boolean
  rotateRange?: [number, number]
  opacity?: boolean
  opacityRange?: [number, number]
  blur?: boolean
  blurRange?: [number, number]
  threshold?: number
  rootMargin?: string
  className?: string
  disabled?: boolean
  easing?: ParallaxEasing
}

export interface ParallaxLayerProps {
  children: ReactNode
  depth?: number
  className?: string
}
