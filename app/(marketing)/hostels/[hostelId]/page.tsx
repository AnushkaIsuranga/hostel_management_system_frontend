'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { HostelImagesApi, HostelsApi } from '@/lib/backendApi'
import { getAccessToken } from '@/lib/auth'
import type {
  HostelImageReadDto,
  HostelRatingSummaryDto,
  HostelReadDto,
  HostelReviewReadDto,
} from '@/types/backend'

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
        const [h, s, r, i] = await Promise.all([
          HostelsApi.get(hostelId),
          HostelsApi.reviews.summary(hostelId),
          HostelsApi.reviews.list(hostelId),
          HostelImagesApi.list(hostelId),
        ])
        if (cancelled) return
        setHostel(h)
        setSummary(s)
        setReviews(r)
        setImages(i)
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

  const priceText = useMemo(() => {
    if (!hostel) return ''
    return `${Number(hostel.minPrice).toLocaleString()} – ${Number(hostel.maxPrice).toLocaleString()}`
  }, [hostel])

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
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/hostels" className="text-sm font-semibold text-amber-800 hover:underline">
          ← Back to hostels
        </Link>
      </div>

      <header className="surface-card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Hostel Details</h1>
        <p className="mt-1 text-sm text-gray-600">Data from `GET /api/hostels/{'{id}'}`</p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </header>

      {loading ? (
        <div className="surface-card p-6 text-sm text-gray-600">Loading…</div>
      ) : !hostel ? (
        <div className="surface-card p-6 text-sm text-gray-600">Hostel not found.</div>
      ) : (
        <>
          <div className="surface-card p-6">
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold text-gray-900">{hostel.name}</div>
              <div className="text-sm text-gray-600">{hostel.address}</div>
              <div className="text-sm text-gray-600">{hostel.city}</div>
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-600">Images</div>
                {!images ? (
                  <div className="mt-2 text-sm text-gray-600">Loading images…</div>
                ) : images.length === 0 ? (
                  <div className="mt-2 text-sm text-gray-600">No images uploaded yet.</div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <img
                          src={image.imageUrl}
                          alt={image.fileName}
                          className="h-32 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Price Range</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">{priceText}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Rating Summary</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {summary ? `${summary.averageRating.toFixed(2)} (${summary.reviewCount})` : '—'}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-600">Gender Policy</div>
                <div className="text-sm text-gray-800">{hostel.genderPolicy}</div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-600">Description</div>
                <div className="text-sm whitespace-pre-line text-gray-800">
                  {hostel.description}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-600">Location URL</div>
                <a
                  href={hostel.locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-amber-800 hover:underline"
                >
                  Open map
                </a>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
            <p className="mt-1 text-sm text-gray-600">
              Read via `GET /api/hostels/{'{hostelId}'}/reviews`
            </p>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Add your review</h3>
              {!isLoggedIn ? (
                <p className="mt-2 text-sm text-gray-600">
                  Guests cannot add reviews.{' '}
                  <Link
                    href={hostelId ? `/login?next=/hostels/${hostelId}` : '/login'}
                    className="font-semibold text-amber-800 hover:underline"
                  >
                    Sign in
                  </Link>{' '}
                  to rate this hostel.
                </p>
              ) : (
                <form className="mt-3 space-y-3" onSubmit={onSubmitReview}>
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Rating</div>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-2xl leading-none"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          {star <= reviewRating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="text-xs font-semibold text-gray-600">
                      Comment (optional)
                    </label>
                    <textarea
                      id="review-comment"
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience"
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
                    className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                  >
                    {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                  </button>
                </form>
              )}
            </div>

            {!reviews ? (
              <div className="mt-4 text-sm text-gray-600">Loading reviews…</div>
            ) : reviews.length === 0 ? (
              <div className="mt-4 text-sm text-gray-600">No reviews yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">{r.userFullName}</div>
                      <div className="text-sm font-semibold text-amber-800">{r.rating}/5</div>
                    </div>
                    {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
