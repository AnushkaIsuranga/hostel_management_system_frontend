'use client'

import React, { useState } from 'react'
import { HostelFilters } from '@/types'

import { FiChevronDown } from 'react-icons/fi'

interface FiltersProps {
  filters: HostelFilters
  onFiltersChange: (filters: HostelFilters) => void
  onReset: () => void
}

const universities = [
  'University of Colombo',
  'University of Peradeniya',
  'University of Moratuwa',
  'University of Kelaniya',
  'University of Sri Jayewardenepura',
  'University of Ruhuna',
  'University of Jaffna',
  'Eastern University',
  'Sabaragamuwa University',
  'Wayamba University',
]

const cities = [
  'Colombo',
  'Kandy',
  'Moratuwa',
  'Kelaniya',
  'Nugegoda',
  'Maharagama',
  'Peradeniya',
  'Matara',
  'Jaffna',
  'Kurunegala',
]

const amenitiesList = [
  'WiFi',
  'AC',
  'Hot Water',
  'Laundry',
  'Parking',
  'Security',
  'Kitchen',
  'Study Room',
  'Common Area',
  'TV',
  'Refrigerator',
  'Attached Bathroom',
]

export default function Filters({ filters, onFiltersChange, onReset }: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState({
    location: true,
    price: true,
    room: true,
    amenities: false,
    other: true,
  })

  const toggleSection = (section: keyof typeof isExpanded) => {
    setIsExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handlePriceChange = (index: 0 | 1, value: string) => {
    const numValue = parseInt(value) || 0
    const newRange: [number, number] = [...filters.priceRange]
    newRange[index] = numValue
    onFiltersChange({ ...filters, priceRange: newRange })
  }

  const handleRoomTypeToggle = (type: 'single' | 'double' | 'triple' | 'shared') => {
    const currentTypes = filters.roomType || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type]
    onFiltersChange({ ...filters, roomType: newTypes })
  }

  const handleGenderToggle = (gender: 'male' | 'female' | 'mixed') => {
    const currentGenders = filters.gender || []
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter((g) => g !== gender)
      : [...currentGenders, gender]
    onFiltersChange({ ...filters, gender: newGenders })
  }

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || []
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity]
    onFiltersChange({ ...filters, amenities: newAmenities })
  }

  const FilterSection = ({
    title,
    section,
    children,
  }: {
    title: string
    section: keyof typeof isExpanded
    children: React.ReactNode
  }) => (
    <div className="mb-4 border-b border-gray-100 pb-4">
      <button
        onClick={() => toggleSection(section)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span
          className={`text-gray-400 transition-transform ${
            isExpanded[section] ? 'rotate-180' : ''
          }`}
        >
          <FiChevronDown aria-hidden="true" />
        </span>
      </button>
      {isExpanded[section] && <div className="space-y-3">{children}</div>}
    </div>
  )

  const Checkbox = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean
    onChange: () => void
    label: string
  }) => (
    <label className="group flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
      />
      <span className="text-sm text-gray-700 transition-colors group-hover:text-amber-700">
        {label}
      </span>
    </label>
  )

  return (
    <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        <button
          onClick={onReset}
          className="text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
        >
          Reset All
        </button>
      </div>

      {/* Filters Content */}
      <div className="space-y-4">
        {/* Location Filters */}
        <FilterSection title="Location" section="location">
          {/* University */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">University</label>
            <select
              value={filters.university || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  university: e.target.value || undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
            <select
              value={filters.city || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  city: e.target.value || undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Max Distance */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Max Distance from University
            </label>
            <select
              value={filters.maxDistance || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxDistance: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Any Distance</option>
              <option value="1">Within 1 km</option>
              <option value="2">Within 2 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
            </select>
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Monthly Rent" section="price">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-600">Min (LKR)</label>
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-600">Max (LKR)</label>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            {/* Price Range Display */}
            <div className="text-center text-xs text-gray-500">
              LKR {filters.priceRange[0].toLocaleString()} - LKR{' '}
              {filters.priceRange[1].toLocaleString()}
            </div>
          </div>
        </FilterSection>

        {/* Room Type & Gender */}
        <FilterSection title="Room Details" section="room">
          {/* Room Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Room Type</label>
            <div className="space-y-2">
              <Checkbox
                checked={(filters.roomType || []).includes('single')}
                onChange={() => handleRoomTypeToggle('single')}
                label="Single Room"
              />
              <Checkbox
                checked={(filters.roomType || []).includes('double')}
                onChange={() => handleRoomTypeToggle('double')}
                label="Double Sharing"
              />
              <Checkbox
                checked={(filters.roomType || []).includes('triple')}
                onChange={() => handleRoomTypeToggle('triple')}
                label="Triple Sharing"
              />
              <Checkbox
                checked={(filters.roomType || []).includes('shared')}
                onChange={() => handleRoomTypeToggle('shared')}
                label="Shared Room"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
            <div className="space-y-2">
              <Checkbox
                checked={(filters.gender || []).includes('male')}
                onChange={() => handleGenderToggle('male')}
                label="Male Only"
              />
              <Checkbox
                checked={(filters.gender || []).includes('female')}
                onChange={() => handleGenderToggle('female')}
                label="Female Only"
              />
              <Checkbox
                checked={(filters.gender || []).includes('mixed')}
                onChange={() => handleGenderToggle('mixed')}
                label="Mixed Gender"
              />
            </div>
          </div>
        </FilterSection>

        {/* Amenities */}
        <FilterSection title="Amenities" section="amenities">
          <div className="grid grid-cols-2 gap-2">
            {amenitiesList.map((amenity) => (
              <Checkbox
                key={amenity}
                checked={(filters.amenities || []).includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                label={amenity}
              />
            ))}
          </div>
        </FilterSection>

        {/* Other Filters */}
        <FilterSection title="Other Options" section="other">
          <Checkbox
            checked={filters.verifiedOnly}
            onChange={() =>
              onFiltersChange({
                ...filters,
                verifiedOnly: !filters.verifiedOnly,
              })
            }
            label="Verified Hostels Only"
          />
          <Checkbox
            checked={filters.availableOnly}
            onChange={() =>
              onFiltersChange({
                ...filters,
                availableOnly: !filters.availableOnly,
              })
            }
            label="Available Rooms Only"
          />

          {/* Minimum Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Minimum Rating</label>
            <select
              value={filters.minRating || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minRating: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
