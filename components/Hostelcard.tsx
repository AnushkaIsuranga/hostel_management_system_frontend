import React from 'react'
import Link from 'next/link'
import { Hostel } from '@/types'

import { FaCheck, FaGraduationCap, FaHeart, FaHome, FaRegHeart, FaStar } from 'react-icons/fa'
import { FiMapPin } from 'react-icons/fi'

interface HostelCardProps {
  hostel: Hostel
  onSave?: (hostelId: string) => void
  isSaved?: boolean
}

export default function HostelCard({ hostel, onSave, isSaved = false }: HostelCardProps) {
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSave?.(hostel.id)
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(price)

  const roomTypeLabel: Record<string, string> = {
    single: 'Single Room',
    double: 'Double Sharing',
    triple: 'Triple Sharing',
    shared: 'Shared Room',
  }

  const genderColor: Record<string, string> = {
    male: 'bg-blue-100 text-blue-700',
    female: 'bg-pink-100 text-pink-700',
    mixed: 'bg-purple-100 text-purple-700',
  }

  return (
    <Link href={`/hostels/${hostel.id}`} className="group block h-full">
      <div className="surface-card relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          {hostel.images?.length ? (
            <img
              src={hostel.images[0]}
              alt={hostel.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-75"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
              <FaHome className="text-6xl text-amber-700" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 lg:group-hover:opacity-100">
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />

            {/* Content */}
            <div className="relative space-y-2 p-4 text-sm text-black">
              <div className="flex items-center gap-2">
                <FaGraduationCap className="text-amber-400" />
                <span className="line-clamp-1">{hostel.university}</span>
                <span className="opacity-60">•</span>
                <FiMapPin />
                <span>{hostel.distanceFromUniversity.toFixed(1)} km</span>
              </div>

              {hostel.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {hostel.amenities.slice(0, 4).map((a, i) => (
                    <span key={i} className="opacity-90">
                      • {a}
                    </span>
                  ))}
                  {hostel.amenities.length > 4 && (
                    <span className="opacity-70">+{hostel.amenities.length - 4} more</span>
                  )}
                </div>
              )}

              {hostel.availableRooms === 0 && (
                <p className="text-xs font-medium text-red-400">Fully booked</p>
              )}
            </div>
          </div>

          {hostel.verified && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs text-white">
              <FaCheck />
              Verified
            </span>
          )}

          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full transition-all ${
              isSaved
                ? 'bg-amber-500 text-white'
                : 'bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-amber-500 hover:text-white'
            }`}
          >
            {isSaved ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* Content */}
        <div className="z-20 flex flex-1 flex-col p-5">
          {/* === ALWAYS VISIBLE SUMMARY === */}
          <div className="space-y-2">
            <h3 className="line-clamp-1 text-lg font-bold text-gray-900 transition-colors group-hover:text-amber-700">
              {hostel.name}
            </h3>

            <p className="line-clamp-1 text-sm text-gray-600">
              {hostel.address}, {hostel.city}
            </p>

            <div className="hidden flex-wrap gap-2 text-xs lg:flex">
              <span className={`chip ${genderColor[hostel.gender]}`}>{hostel.gender}</span>

              <span className="chip bg-amber-100 text-amber-700">
                {roomTypeLabel[hostel.roomType]}
              </span>

              {hostel.utilitiesIncluded && (
                <span className="chip bg-green-100 text-green-700">Utilities Included</span>
              )}
            </div>

            <div className="flex items-end justify-between pt-2">
              <div>
                <p className="text-xl font-bold text-amber-700">
                  {formatPrice(hostel.monthlyRent)}
                </p>
                <p className="text-xs text-gray-500">per month</p>
              </div>

              <div>
                {hostel.rating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <FaStar className="text-amber-500" />
                    <span className="font-semibold">{hostel.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({hostel.reviewCount})</span>
                  </div>
                )}
                {hostel.availableRooms > 0 && (
                  <span className="text-xs text-green-600">{hostel.availableRooms} room(s)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
