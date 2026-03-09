'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  AmenitiesApi,
  HostelAmenitiesApi,
  HostelImagesApi,
  HostelsApi,
  UsersApi,
} from '@/lib/backendApi'
import { getAccessToken } from '@/lib/auth'
import { ApiInteractionType, trackInteractionEvent } from '@/lib/interactionTracking'
import { buildGoogleMapsQueryUrl } from '@/lib/location'
import type {
  HostelImageReadDto,
  HostelRatingSummaryDto,
  HostelReadDto,
  HostelReviewReadDto,
} from '@/types/backend'

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  return (
    <span className={sizes[size]}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  )
}

function RatingBadge({ value }: { value: number }) {
  const color =
    value >= 4.5
      ? 'bg-green-700'
      : value >= 4.0
        ? 'bg-green-600'
        : value >= 3.5
          ? 'bg-amber-700'
          : 'bg-amber-600'
  const label =
    value >= 4.5 ? 'Exceptional' : value >= 4.0 ? 'Superb' : value >= 3.5 ? 'Very Good' : 'Good'
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${color} flex h-10 w-10 items-center justify-center rounded-tl-lg rounded-tr-lg rounded-br-lg text-sm font-bold text-white`}
      >
        {value.toFixed(1)}
      </div>
      <div>
        <div className="text-sm font-bold text-gray-900">{label}</div>
      </div>
    </div>
  )
}

function normalizeHostelImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl

  const normalized = imageUrl.replace(/\\/g, '/')

  if (normalized.startsWith('/uploads/')) {
    return normalized
  }

  const uploadsIndex = normalized.toLowerCase().indexOf('/uploads/')
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex)
  }

  return normalized
}

function formatMonthlyPrice(minPrice: number, maxPrice: number): string {
  const normalizedMin = Number(minPrice)
  const normalizedMax = Number(maxPrice)

  if (!Number.isFinite(normalizedMin) && !Number.isFinite(normalizedMax)) {
    return 'Call for details'
  }

  if (!Number.isFinite(normalizedMin) || !Number.isFinite(normalizedMax)) {
    const value = Number.isFinite(normalizedMin) ? normalizedMin : normalizedMax
    return `${value.toLocaleString()} / month`
  }

  if (normalizedMin === normalizedMax) {
    return `${normalizedMin.toLocaleString()} / month`
  }

  return `${normalizedMin.toLocaleString()} - ${normalizedMax.toLocaleString()} / month`
}

function toTelephoneHref(phoneNumber: string): string {
  const sanitized = phoneNumber.replace(/[^+\d]/g, '')
  return sanitized ? `tel:${sanitized}` : ''
}

type GalleryImage = {
  id: string
  fileName: string
  imageUrl: string
}

export default function Page() {
  const params = useParams<{ hostelId?: string }>()
  const hostelId = Array.isArray(params?.hostelId) ? params.hostelId[0] : params?.hostelId

  const [hostel, setHostel] = useState<HostelReadDto | null>(null)
  const [images, setImages] = useState<HostelImageReadDto[] | null>(null)
  const [summary, setSummary] = useState<HostelRatingSummaryDto | null>(null)
  const [reviews, setReviews] = useState<HostelReviewReadDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState<string>('')
  const [ownerEmail, setOwnerEmail] = useState<string>('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest')

  useEffect(() => {
    setIsLoggedIn(Boolean(getAccessToken()))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!hostelId) {
        setError('Missing hostel id in route')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [h, s, r] = await Promise.all([
          HostelsApi.get(hostelId),
          HostelsApi.reviews.summary(hostelId),
          HostelsApi.reviews.list(hostelId),
        ])
        const [amenityCatalog, amenityLinks] = await Promise.all([
          AmenitiesApi.list(),
          HostelAmenitiesApi.list(),
        ])
        if (cancelled) return
        setHostel(h)
        setSummary(s)
        setReviews(r)
        try {
          const hostelImageList = await HostelImagesApi.list(hostelId)
          if (!cancelled) {
            setImages(hostelImageList)
          }
        } catch {
          if (!cancelled) {
            setImages([])
          }
        }
        const amenityIds = amenityLinks
          .filter((link) => link.hostelId === hostelId)
          .map((link) => link.amenityId)
        const amenityNames = amenityIds
          .map((amenityId) => amenityCatalog.find((amenity) => amenity.id === amenityId)?.name)
          .filter((name): name is string => Boolean(name))
        setAmenities(amenityNames)
        void UsersApi.get(h.ownerId)
          .then((owner) => {
            if (cancelled) return
            setOwnerPhoneNumber(owner.phoneNumber ?? '')
            setOwnerEmail(owner.email ?? '')
          })
          .catch(() => {
            if (cancelled) return
            setOwnerPhoneNumber('')
            setOwnerEmail('')
          })
        void trackInteractionEvent({
          eventType: ApiInteractionType.ViewHostel,
          hostelId,
          metadata: { source: 'hostel-details' },
        })
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load hostel')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [hostelId])

  const mapUrl = useMemo(() => {
    if (!hostel) return ''
    if (hostel.googleMapsUrl?.trim()) return hostel.googleMapsUrl
    return buildGoogleMapsQueryUrl(hostel.latitude, hostel.longitude)
  }, [hostel])

  const monthlyPriceText = useMemo(() => {
    if (!hostel) return 'Call for details'
    return formatMonthlyPrice(hostel.minPrice, hostel.maxPrice)
  }, [hostel])

  const callHref = useMemo(() => toTelephoneHref(ownerPhoneNumber), [ownerPhoneNumber])
  const emailHref = useMemo(
    () => (ownerEmail.trim() ? `mailto:${ownerEmail.trim()}` : ''),
    [ownerEmail],
  )

  const distanceText = useMemo(() => {
    if (!hostel) return 'Distance unavailable'
    const maybeDistance =
      (hostel as HostelReadDto & { distanceKm?: number; distanceToUniversityKm?: number })
        .distanceToUniversityKm ??
      (hostel as HostelReadDto & { distanceKm?: number; distanceToUniversityKm?: number })
        .distanceKm
    if (typeof maybeDistance === 'number' && Number.isFinite(maybeDistance)) {
      return `${maybeDistance.toFixed(1)} km from university`
    }
    return 'Distance unavailable'
  }, [hostel])

  const sortedReviews = useMemo(() => {
    if (!reviews) return null
    const copy = [...reviews]
    if (reviewSort === 'highest') {
      copy.sort((a, b) => b.rating - a.rating)
      return copy
    }
    if (reviewSort === 'lowest') {
      copy.sort((a, b) => a.rating - b.rating)
      return copy
    }
    copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return copy
  }, [reviews, reviewSort])

  const heroImages = useMemo((): GalleryImage[] => {
    const seen = new Set<string>()
    const result: GalleryImage[] = []

    for (const image of images ?? []) {
      const normalizedUrl = normalizeHostelImageUrl(image.imageUrl)
      if (!normalizedUrl || seen.has(normalizedUrl)) continue
      seen.add(normalizedUrl)
      result.push({
        id: image.id,
        fileName: image.fileName || `Hostel image ${result.length + 1}`,
        imageUrl: normalizedUrl,
      })
    }

    for (const imageUrl of hostel?.images ?? []) {
      const normalizedUrl = normalizeHostelImageUrl(imageUrl)
      if (!normalizedUrl || seen.has(normalizedUrl)) continue
      seen.add(normalizedUrl)
      result.push({
        id: `hostel-image-${result.length + 1}`,
        fileName: `Hostel image ${result.length + 1}`,
        imageUrl: normalizedUrl,
      })
    }

    return result
  }, [images, hostel])

  async function onSubmitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setReviewError(null)
    setReviewSuccess(null)
    if (!hostelId) {
      setReviewError('Missing hostel id in route')
      return
    }
    const token = getAccessToken()
    if (!token) {
      setReviewError('You must be logged in to add a review.')
      return
    }
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating from 1 to 5 stars.')
      return
    }
    try {
      setReviewSubmitting(true)
      await HostelsApi.reviews.create(
        hostelId,
        {
          rating: reviewRating,
          comment: reviewComment.trim() ? reviewComment.trim() : null,
        },
        token,
      )
      const [updatedSummary, updatedReviews] = await Promise.all([
        HostelsApi.reviews.summary(hostelId),
        HostelsApi.reviews.list(hostelId),
      ])
      setSummary(updatedSummary)
      setReviews(updatedReviews)
      setReviewRating(0)
      setReviewComment('')
      setReviewSuccess('Review submitted successfully.')
      void trackInteractionEvent({
        eventType: ApiInteractionType.ContactOwner,
        hostelId,
        metadata: { action: 'review_submit' },
      })
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  function openLightbox(index: number) {
    setLightboxIndex(index)
    void trackInteractionEvent({
      eventType: ApiInteractionType.ViewHostel,
      hostelId: hostel?.id,
      metadata: { action: 'gallery_open', index },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-amber-800 px-4 py-3">
          <div className="mx-auto max-w-6xl">
            <Link href="/hostels" className="text-sm font-medium text-amber-100 hover:text-white">
              ← Back to results
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-gray-500">
          Loading property details…
        </div>
      </div>
    )
  }

  if (error || !hostel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-amber-800 px-4 py-3">
          <div className="mx-auto max-w-6xl">
            <Link href="/hostels" className="text-sm font-medium text-amber-100 hover:text-white">
              ← Back to results
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? 'Hostel not found.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top nav strip */}
      <div className="bg-amber-800 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/hostels"
            className="text-sm font-medium text-amber-100 transition-colors hover:text-white"
          >
            ← Back to results
          </Link>
          <span className="text-amber-400">·</span>
          <span className="truncate text-sm text-amber-200">{hostel.name}</span>
        </div>
      </div>

      {/* Property header */}
      <div className="border-b border-gray-200 bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-800 uppercase">
                  Hostel
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{hostel.genderPolicy}</span>
                {hostel.isVerified && (
                  <>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Verified hostel
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl leading-tight font-extrabold text-gray-900">{hostel.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{monthlyPriceText}</span>
                <span>
                  {summary
                    ? `${summary.averageRating.toFixed(1)} ★ (${summary.reviewCount})`
                    : 'No reviews yet'}
                </span>
                <span>{distanceText}</span>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  void trackInteractionEvent({
                    eventType: ApiInteractionType.ContactOwner,
                    hostelId: hostel.id,
                    metadata: { action: 'map_click' },
                  })
                }
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:underline"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {hostel.address}, {hostel.city}
              </a>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {summary && <RatingBadge value={summary.averageRating} />}
              {summary && (
                <p className="text-xs text-gray-500">
                  {summary.reviewCount} review{summary.reviewCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo gallery */}
      <div className="bg-gray-900 px-4 py-3">
        <div className="mx-auto max-w-6xl">
          {heroImages.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl bg-gray-800 text-sm text-gray-500">
              No photos available
            </div>
          ) : (
            <div className="grid h-64 grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-xl md:h-80">
              {/* Main large image */}
              <div
                className="group relative col-span-2 row-span-2 cursor-pointer"
                onClick={() => openLightbox(0)}
              >
                <Image
                  src={heroImages[0].imageUrl}
                  alt={heroImages[0].fileName}
                  fill
                  className="object-cover transition-all group-hover:brightness-90"
                  sizes="50vw"
                />
                <div className="absolute right-3 bottom-3 rounded-lg bg-black/60 px-3 py-1 text-xs text-white">
                  View all {heroImages.length} photos
                </div>
              </div>
              {/* Side thumbnails */}
              {heroImages.slice(1, 5).map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative cursor-pointer"
                  onClick={() => openLightbox(idx + 1)}
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.fileName}
                    fill
                    className="object-cover transition-all group-hover:brightness-90"
                    sizes="25vw"
                  />
                  {idx === 3 && heroImages.length > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-lg font-bold text-white">+{heroImages.length - 5}</span>
                    </div>
                  )}
                </div>
              ))}
              {/* Fill blank cells if fewer than 5 images */}
              {Array.from({ length: Math.max(0, 4 - (heroImages.length - 1)) }).map((_, i) => (
                <div key={`blank-${i}`} className="bg-gray-800" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick reviews */}
      {sortedReviews && sortedReviews.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">What students say</h2>
              <a href="#reviews" className="text-sm font-semibold text-amber-800 hover:underline">
                Read all reviews
              </a>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sortedReviews.slice(0, 2).map((r) => (
                <div key={`quick-${r.id}`} className="rounded-lg bg-gray-50 p-4">
                  <StarRating rating={r.rating} size="sm" />
                  <p className="mt-2 text-sm text-gray-700">
                    {r.comment || 'No written comment provided.'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && heroImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-3xl font-bold text-white transition-colors hover:text-amber-300"
            onClick={() => setLightboxIndex(null)}
          >
            ×
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute top-1/2 left-4 -translate-y-1/2 text-3xl text-white transition-colors hover:text-amber-300"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((i) => Math.max(0, (i ?? 1) - 1))
                void trackInteractionEvent({
                  eventType: ApiInteractionType.ViewHostel,
                  hostelId: hostel.id,
                  metadata: { action: 'image_prev' },
                })
              }}
            >
              ‹
            </button>
          )}
          {lightboxIndex < heroImages.length - 1 && (
            <button
              className="absolute top-1/2 right-4 -translate-y-1/2 text-3xl text-white transition-colors hover:text-amber-300"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((i) => Math.min(heroImages.length - 1, (i ?? 0) + 1))
                void trackInteractionEvent({
                  eventType: ApiInteractionType.ViewHostel,
                  hostelId: hostel.id,
                  metadata: { action: 'image_next' },
                })
              }}
            >
              ›
            </button>
          )}
          <div
            className="relative h-[70vh] max-h-[80vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={heroImages[lightboxIndex].imageUrl}
              alt={heroImages[lightboxIndex].fileName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <p className="absolute bottom-4 text-sm text-gray-400">
            {lightboxIndex + 1} / {heroImages.length}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-2">
            {/* About */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-gray-900">About this property</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">
                {hostel.description}
              </p>
            </section>

            {/* Amenities */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-gray-900">Amenities</h2>
              {amenities.length === 0 ? (
                <p className="text-sm text-gray-500">No amenities listed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Location */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-gray-900">Location</h2>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{hostel.address}</p>
                  <p className="text-sm text-gray-500">{hostel.city}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {hostel.latitude}, {hostel.longitude}
                  </p>
                </div>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    void trackInteractionEvent({
                      eventType: ApiInteractionType.ContactOwner,
                      hostelId: hostel.id,
                      metadata: { action: 'open-map-link' },
                    })
                  }
                  className="ml-4 shrink-0 rounded-lg border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50"
                >
                  View on map
                </a>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <iframe
                  title="Hostel location map"
                  src={`https://maps.google.com/maps?q=${hostel.latitude},${hostel.longitude}&z=15&output=embed`}
                  className="h-52 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>

            {/* Reviews list */}
            <section
              id="reviews"
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Guest reviews</h2>
                <div className="flex items-center gap-3">
                  {summary && (
                    <>
                      <RatingBadge value={summary.averageRating} />
                      <span className="text-sm text-gray-500">
                        {summary.reviewCount} review{summary.reviewCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                  <label className="text-sm text-gray-600" htmlFor="review-sort">
                    Sort by
                  </label>
                  <select
                    id="review-sort"
                    value={reviewSort}
                    onChange={(e) =>
                      setReviewSort(e.target.value as 'newest' | 'highest' | 'lowest')
                    }
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                  </select>
                </div>
              </div>

              {/* Write review */}
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Share your experience</h3>
                {!isLoggedIn ? (
                  <p className="text-sm text-gray-600">
                    <Link
                      href={hostelId ? `/login?next=/hostels/${hostelId}` : '/login'}
                      className="font-semibold text-amber-800 hover:underline"
                    >
                      Sign in
                    </Link>{' '}
                    to leave a review for this property.
                  </p>
                ) : (
                  <form className="space-y-4" onSubmit={onSubmitReview}>
                    <div>
                      <div className="mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                        Your rating
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-3xl leading-none transition-transform hover:scale-110"
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <span
                              className={star <= reviewRating ? 'text-amber-500' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="review-comment"
                        className="mb-1 block text-xs font-semibold tracking-wide text-gray-600 uppercase"
                      >
                        Comment{' '}
                        <span className="font-normal text-gray-400 normal-case">(optional)</span>
                      </label>
                      <textarea
                        id="review-comment"
                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="What did you like or dislike? What made your stay memorable?"
                      />
                    </div>
                    {reviewError && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {reviewError}
                      </p>
                    )}
                    {reviewSuccess && (
                      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                        {reviewSuccess}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
                    >
                      {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                    </button>
                  </form>
                )}
              </div>

              {/* Reviews */}
              {!sortedReviews ? (
                <p className="text-sm text-gray-500">Loading reviews…</p>
              ) : sortedReviews.length === 0 ? (
                <div className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  No reviews yet — be the first to share your experience!
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedReviews.map((r) => (
                    <div
                      key={r.id}
                      className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white">
                            {r.userFullName?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {r.userFullName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-tl-lg rounded-tr-lg rounded-br-lg text-xs font-bold text-white ${r.rating >= 4 ? 'bg-green-600' : r.rating >= 3 ? 'bg-amber-600' : 'bg-red-500'}`}
                          >
                            {r.rating}.0
                          </div>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size="sm" />
                      {r.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column — sticky booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price card */}
              <div className="overflow-hidden rounded-xl border-2 border-amber-700 bg-white shadow-lg">
                <div className="bg-amber-700 px-5 py-3">
                  <p className="text-xs font-semibold tracking-wide text-amber-200 uppercase">
                    Monthly price range
                  </p>
                  <p className="mt-0.5 text-2xl font-extrabold text-white">{monthlyPriceText}</p>
                </div>
                <div className="space-y-4 p-5">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-medium text-amber-700">
                      Contact owner for availability and exact terms.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Monthly price</span>
                      <span className="font-semibold text-gray-900">{monthlyPriceText}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gender policy</span>
                      <span className="font-semibold text-gray-900">{hostel.genderPolicy}</span>
                    </div>
                    {summary && (
                      <div className="flex justify-between">
                        <span>Rating</span>
                        <span className="font-semibold text-gray-900">
                          {summary.averageRating.toFixed(1)} / 5.0
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Near university</span>
                      <span className="font-semibold text-gray-900">{distanceText}</span>
                    </div>
                    {hostel.isVerified && (
                      <div className="flex justify-between">
                        <span>Listing status</span>
                        <span className="font-semibold text-green-700">Verified hostel</span>
                      </div>
                    )}
                  </div>
                  <details className="group relative">
                    <summary className="cursor-pointer list-none rounded-lg bg-amber-700 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-amber-800">
                      Contact hostel owner
                    </summary>
                    <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-2">
                      {callHref ? (
                        <a
                          href={callHref}
                          onClick={() =>
                            void trackInteractionEvent({
                              eventType: ApiInteractionType.ContactOwner,
                              hostelId: hostel.id,
                              metadata: { action: 'call_owner' },
                            })
                          }
                          className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-amber-50"
                        >
                          Call owner
                        </a>
                      ) : (
                        <span className="block rounded-md px-3 py-2 text-sm text-gray-400">
                          Call unavailable
                        </span>
                      )}
                      {emailHref ? (
                        <a
                          href={emailHref}
                          onClick={() =>
                            void trackInteractionEvent({
                              eventType: ApiInteractionType.ContactOwner,
                              hostelId: hostel.id,
                              metadata: { action: 'email_owner' },
                            })
                          }
                          className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-amber-50"
                        >
                          Email owner
                        </a>
                      ) : (
                        <span className="block rounded-md px-3 py-2 text-sm text-gray-400">
                          Email unavailable
                        </span>
                      )}
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          void trackInteractionEvent({
                            eventType: ApiInteractionType.ContactOwner,
                            hostelId: hostel.id,
                            metadata: { action: 'map_click' },
                          })
                        }
                        className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-amber-50"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </details>
                </div>
              </div>

              {/* Property details card */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Property highlights</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>{hostel.city}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>{hostel.genderPolicy} accommodation</span>
                  </li>
                  {summary && summary.reviewCount > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">✓</span>
                      <span>
                        {summary.reviewCount} verified review{summary.reviewCount !== 1 ? 's' : ''}
                      </span>
                    </li>
                  )}
                  {hostel.isVerified && (
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">✓</span>
                      <span>Verified hostel</span>
                    </li>
                  )}
                </ul>
                <a
                  href="mailto:support@hostelhub.lk?subject=Report%20incorrect%20hostel%20information"
                  className="mt-4 inline-block text-xs font-semibold text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
                >
                  Report incorrect information
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
