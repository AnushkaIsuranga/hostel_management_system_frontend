import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { HostelReadDto } from '@/types/backend'
import { ApiHostelStatus } from '@/types/backend'

import { FaHeart, FaHome, FaRegHeart } from 'react-icons/fa'
import { FiExternalLink, FiMapPin } from 'react-icons/fi'

interface HostelCardProps {
  hostel: HostelReadDto
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

  const formatPriceRange = (minPrice: number, maxPrice: number) => {
    if (Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice === maxPrice) {
      return formatPrice(minPrice)
    }
    return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
  }

  const statusLabel: Record<ApiHostelStatus, string> = {
    [ApiHostelStatus.Pending]: 'Pending',
    [ApiHostelStatus.Active]: 'Active',
    [ApiHostelStatus.Disabled]: 'Disabled',
  }

  const statusClasses: Record<ApiHostelStatus, string> = {
    [ApiHostelStatus.Pending]: 'bg-amber-100 text-amber-800',
    [ApiHostelStatus.Active]: 'bg-green-100 text-green-700',
    [ApiHostelStatus.Disabled]: 'bg-gray-200 text-gray-700',
  }

  const primaryImage = hostel.images?.[0]

  return (
    <Link href={`/hostels/${hostel.id}`} className="group block h-full">
      <div className="surface-card relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          {primaryImage ? (
            <Image src={primaryImage} alt={hostel.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-amber-100 to-amber-200">
              <FaHome className="text-6xl text-amber-700" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 lg:group-hover:opacity-100">
            {/* Gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-white via-white/80 to-transparent" />

            {/* Content */}
            <div className="relative space-y-2 p-4 text-sm text-black">
              <div className="flex items-center gap-2">
                <FiMapPin />
                <span className="line-clamp-1">{hostel.city}</span>
              </div>

              <p className="line-clamp-2 text-xs text-gray-700">{hostel.description}</p>

              {hostel.locationUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <FiExternalLink />
                  <span className="line-clamp-1">Open location</span>
                </div>
              )}
            </div>
          </div>

          <span
            className={`badge absolute top-3 left-3 ${statusClasses[hostel.status]}`}
            title={`Status: ${statusLabel[hostel.status]}`}
          >
            {statusLabel[hostel.status]}
          </span>

          {hostel.isVerified && (
            <span className="badge absolute top-3 left-24 bg-emerald-100 text-emerald-700">
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
              {hostel.genderPolicy && (
                <span className="chip bg-purple-100 text-purple-700">{hostel.genderPolicy}</span>
              )}
              <span className="chip bg-amber-100 text-amber-700">
                {formatPriceRange(hostel.minPrice, hostel.maxPrice)}
              </span>
            </div>

            <div className="flex items-end justify-between pt-2">
              <div>
                <p className="text-xl font-bold text-amber-700">
                  {formatPriceRange(hostel.minPrice, hostel.maxPrice)}
                </p>
                <p className="text-xs text-gray-500">price range</p>
              </div>

              <div>
                <span className="text-xs text-gray-500">ID: {hostel.id.slice(0, 8)}…</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
