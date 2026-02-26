'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiSliders, FiX } from 'react-icons/fi'

import Filters from '@/components/Filters'
import HostelCard from '@/components/Hostelcard'
import { HostelsApi } from '@/lib/backendApi'
import { ApiHostelStatus, type HostelReadDto } from '@/types/backend'
import type { HostelFilters, SortOption } from '@/types'

export default function Page() {
  const [hostels, setHostels] = useState<HostelReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('price-low-to-high')
  const [savedHostels, setSavedHostels] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [filters, setFilters] = useState<HostelFilters>({
    priceRange: [0, 50000],
    verifiedOnly: false,
    availableOnly: false,
  })

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setHostels(await HostelsApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const filteredHostels = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const results = hostels.filter((hostel) => {
      if (normalizedQuery) {
        const matchesSearch =
          hostel.name.toLowerCase().includes(normalizedQuery) ||
          hostel.address.toLowerCase().includes(normalizedQuery) ||
          hostel.city.toLowerCase().includes(normalizedQuery) ||
          hostel.description.toLowerCase().includes(normalizedQuery)
        if (!matchesSearch) return false
      }

      if (filters.city && hostel.city !== filters.city) return false

      if (filters.verifiedOnly && !hostel.isVerified) return false

      if (filters.availableOnly && hostel.status !== ApiHostelStatus.Active) return false

      const [minPriceFilter, maxPriceFilter] = filters.priceRange
      if (hostel.maxPrice < minPriceFilter || hostel.minPrice > maxPriceFilter) return false

      return true
    })

    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'price-low-to-high':
          return a.minPrice - b.minPrice
        case 'price-high-to-low':
          return b.maxPrice - a.maxPrice
        case 'newest-first':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [hostels, searchQuery, filters, sortBy])

  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 50000],
      verifiedOnly: false,
      availableOnly: false,
    })
    setSearchQuery('')
    setSortBy('price-low-to-high')
  }

  const handleSaveHostel = (hostelId: string) => {
    setSavedHostels((prev) =>
      prev.includes(hostelId) ? prev.filter((id) => id !== hostelId) : [...prev, hostelId],
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <div className="mx-auto px-4 pt-10 pb-8 text-center text-gray-600 sm:px-6 lg:px-24">
          Loading hostels...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <div className="mx-auto px-4 pt-10 pb-8 sm:px-6 lg:px-24">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="mb-4 font-semibold">Failed to load hostels</p>
            <p className="mb-4 text-sm">{error}</p>
            <button onClick={reload} className="accent-btn rounded-lg px-4 py-2">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <div className="bg-gradient-to-br from-amber-50 to-white px-4 pt-5 pb-8 sm:px-6 lg:px-16">
        <div className="mx-auto px-10">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Find Your Perfect Hostel</h1>
          <p className="text-lg text-gray-600">Browse {hostels.length} hostels</p>
        </div>
      </div>

      <div className="mx-auto px-4 pt-5 pb-8 sm:px-6 lg:px-24">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden flex-shrink-0 lg:block lg:w-80">
            <Filters filters={filters} onFiltersChange={setFilters} onReset={handleResetFilters} />
          </aside>

          <div className="flex-1">
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                      <FiSearch aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name, location, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:w-64">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="price-low-to-high">Price: Low to High</option>
                    <option value="price-high-to-low">Price: High to Low</option>
                    <option value="newest-first">Newest First</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="accent-btn flex items-center justify-center gap-2 rounded-lg px-6 py-3 lg:hidden"
                >
                  <FiSliders aria-hidden="true" />
                  <span>Filters</span>
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredHostels.length}</span> hostel
                {filteredHostels.length !== 1 ? 's' : ''}
              </div>
            </div>

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
