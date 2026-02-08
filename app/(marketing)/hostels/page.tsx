'use client'

import React, { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Filters from '@/components/Filters'
import HostelCard from '@/components/Hostelcard'
import type { User, Hostel, HostelFilters, SortOption } from '../../../types'

import { FiSearch, FiSliders, FiX } from 'react-icons/fi'

// Mock data - replace with actual API calls
const mockHostels: Hostel[] = [
  {
    id: '1',
    name: 'Green Valley Student Hostel',
    description: 'Comfortable accommodation near University of Colombo',
    address: '123 Reid Avenue, Colombo 07',
    city: 'Colombo',
    university: 'University of Colombo',
    distanceFromUniversity: 0.8,
    monthlyRent: 12000,
    securityDeposit: 24000,
    utilitiesIncluded: true,
    roomType: 'double',
    totalRooms: 20,
    availableRooms: 5,
    amenities: ['WiFi', 'Hot Water', 'Security', 'Kitchen', 'Study Room'],
    gender: 'female',
    verified: true,
    rating: 4.5,
    reviewCount: 28,
    images: [],
    ownerId: 'owner1',
    ownerName: 'Nimal Perera',
    ownerPhone: '+94771234567',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'University View Hostel',
    description: 'Modern hostel with excellent facilities',
    address: '45 Peradeniya Road, Kandy',
    city: 'Kandy',
    university: 'University of Peradeniya',
    distanceFromUniversity: 1.2,
    monthlyRent: 15000,
    securityDeposit: 30000,
    utilitiesIncluded: false,
    roomType: 'single',
    totalRooms: 15,
    availableRooms: 3,
    amenities: ['WiFi', 'AC', 'Hot Water', 'Laundry', 'Parking', 'Security'],
    gender: 'male',
    verified: true,
    rating: 4.8,
    reviewCount: 42,
    images: [],
    ownerId: 'owner2',
    ownerName: 'Saman Silva',
    ownerPhone: '+94772345678',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Campus Lodge',
    description: 'Budget-friendly hostel for students',
    address: '89 Bauddhaloka Mawatha, Colombo 07',
    city: 'Colombo',
    university: 'University of Colombo',
    distanceFromUniversity: 1.5,
    monthlyRent: 9500,
    securityDeposit: 19000,
    utilitiesIncluded: true,
    roomType: 'triple',
    totalRooms: 12,
    availableRooms: 8,
    amenities: ['WiFi', 'Hot Water', 'Kitchen', 'Common Area'],
    gender: 'mixed',
    verified: false,
    rating: 3.9,
    reviewCount: 15,
    images: [],
    ownerId: 'owner3',
    ownerName: 'Kamala Fernando',
    ownerPhone: '+94773456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Moratuwa Tech Hostel',
    description: 'Premium hostel for engineering students',
    address: '12 Station Road, Moratuwa',
    city: 'Moratuwa',
    university: 'University of Moratuwa',
    distanceFromUniversity: 0.5,
    monthlyRent: 18000,
    securityDeposit: 36000,
    utilitiesIncluded: true,
    roomType: 'single',
    totalRooms: 25,
    availableRooms: 0,
    amenities: ['WiFi', 'AC', 'Hot Water', 'Study Room', 'Attached Bathroom', 'Security'],
    gender: 'male',
    verified: true,
    rating: 4.7,
    reviewCount: 56,
    images: [],
    ownerId: 'owner4',
    ownerName: 'Ravi Wickramasinghe',
    ownerPhone: '+94774567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Kelaniya Student Residence',
    description: 'Spacious rooms with modern amenities',
    address: '67 Kandy Road, Kelaniya',
    city: 'Kelaniya',
    university: 'University of Kelaniya',
    distanceFromUniversity: 2.0,
    monthlyRent: 11000,
    securityDeposit: 22000,
    utilitiesIncluded: false,
    roomType: 'double',
    totalRooms: 18,
    availableRooms: 6,
    amenities: ['WiFi', 'Hot Water', 'Laundry', 'Parking', 'TV', 'Refrigerator'],
    gender: 'female',
    verified: true,
    rating: 4.3,
    reviewCount: 34,
    images: [],
    ownerId: 'owner5',
    ownerName: 'Anura Jayawardena',
    ownerPhone: '+94775678901',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    name: 'Nugegoda Comfort Inn',
    description: 'Cozy hostel with home-like atmosphere',
    address: '34 High Level Road, Nugegoda',
    city: 'Nugegoda',
    university: 'University of Sri Jayewardenepura',
    distanceFromUniversity: 1.8,
    monthlyRent: 10500,
    securityDeposit: 21000,
    utilitiesIncluded: true,
    roomType: 'shared',
    totalRooms: 10,
    availableRooms: 4,
    amenities: ['WiFi', 'Hot Water', 'Kitchen', 'Common Area', 'Security'],
    gender: 'mixed',
    verified: false,
    rating: 4.0,
    reviewCount: 22,
    images: [],
    ownerId: 'owner6',
    ownerName: 'Priya Dias',
    ownerPhone: '+94776789012',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('price-low-to-high')
  const [savedHostels, setSavedHostels] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [filters, setFilters] = useState<HostelFilters>({
    priceRange: [0, 50000],
    verifiedOnly: false,
    availableOnly: false,
  })

  // Filter and sort hostels
  const filteredHostels = mockHostels
    .filter((hostel) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          hostel.name.toLowerCase().includes(query) ||
          hostel.address.toLowerCase().includes(query) ||
          hostel.university.toLowerCase().includes(query) ||
          hostel.city.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // University filter
      if (filters.university && hostel.university !== filters.university) return false

      // City filter
      if (filters.city && hostel.city !== filters.city) return false

      // Price range
      if (hostel.monthlyRent < filters.priceRange[0] || hostel.monthlyRent > filters.priceRange[1])
        return false

      // Room type
      if (filters.roomType && filters.roomType.length > 0) {
        if (!filters.roomType.includes(hostel.roomType)) return false
      }

      // Gender
      if (filters.gender && filters.gender.length > 0) {
        if (!filters.gender.includes(hostel.gender)) return false
      }

      // Amenities
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every((amenity) =>
          hostel.amenities.includes(amenity),
        )
        if (!hasAllAmenities) return false
      }

      // Verified only
      if (filters.verifiedOnly && !hostel.verified) return false

      // Available only
      if (filters.availableOnly && hostel.availableRooms === 0) return false

      // Max distance
      if (filters.maxDistance && hostel.distanceFromUniversity > filters.maxDistance) return false

      // Min rating
      if (filters.minRating && hostel.rating < filters.minRating) return false

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low-to-high':
          return a.monthlyRent - b.monthlyRent
        case 'price-high-to-low':
          return b.monthlyRent - a.monthlyRent
        case 'rating-high-to-low':
          return b.rating - a.rating
        case 'distance-low-to-high':
          return a.distanceFromUniversity - b.distanceFromUniversity
        case 'newest-first':
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

  const handleSaveHostel = (hostelId: string) => {
    setSavedHostels((prev) =>
      prev.includes(hostelId) ? prev.filter((id) => id !== hostelId) : [...prev, hostelId],
    )
  }

  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 50000],
      verifiedOnly: false,
      availableOnly: false,
    })
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-amber-50 to-white px-4 pt-5 pb-8 sm:px-6 lg:px-16">
        <div className="mx-auto px-10">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Find Your Perfect Hostel</h1>
          <p className="text-lg text-gray-600">
            Browse {mockHostels.length} verified hostels near Sri Lankan universities
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 pt-5 pb-8 sm:px-6 lg:px-24">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden flex-shrink-0 lg:block lg:w-80">
            <Filters filters={filters} onFiltersChange={setFilters} onReset={handleResetFilters} />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar & Controls */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                      <FiSearch aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name, location, or university..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="sm:w-64">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="price-low-to-high">Price: Low to High</option>
                    <option value="price-high-to-low">Price: High to Low</option>
                    <option value="rating-high-to-low">Highest Rated</option>
                    <option value="distance-low-to-high">Nearest First</option>
                    <option value="newest-first">Newest First</option>
                  </select>
                </div>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="accent-btn flex items-center justify-center gap-2 rounded-lg px-6 py-3 lg:hidden"
                >
                  <FiSliders aria-hidden="true" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredHostels.length}</span> hostel
                {filteredHostels.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Hostel Grid */}
            {filteredHostels.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHostels.map((hostel) => (
                  <HostelCard
                    key={hostel.id}
                    hostel={hostel}
                    onSave={handleSaveHostel}
                    isSaved={savedHostels.includes(hostel.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mb-4 flex justify-center text-gray-400">
                  <FiSearch className="text-6xl" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">No hostels found</h3>
                <p className="mb-6 text-gray-600">Try adjusting your filters or search criteria</p>
                <button onClick={handleResetFilters} className="accent-btn rounded-lg px-6 py-3">
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-full max-w-md overflow-y-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
              <Filters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
              />
              <button
                onClick={() => setShowMobileFilters(false)}
                className="accent-btn mt-6 w-full rounded-lg px-6 py-3"
              >
                Show {filteredHostels.length} Result
                {filteredHostels.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
