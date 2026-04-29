'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

import { AmenitiesApi, AuthApi, StudentPreferencesApi, UniversitiesApi } from '@/lib/backendApi'
import { setAuthSession } from '@/lib/auth'
import { ApiUserRole, type AmenityReadDto, type UniversityReadDto } from '@/types/backend'
import StudentPreferencesFields from '@/components/auth/StudentPreferencesFields'

type PriorityKey = 'price' | 'distance' | 'rating'

const PRIORITY_LABELS: Record<PriorityKey, string> = {
  price: 'Price',
  distance: 'Distance',
  rating: 'Rating',
}

const PRIORITY_WEIGHTS_BY_POSITION = [0.5, 0.3, 0.2]
const MAX_AMENITIES_SELECTION = 10

export default function OnboardingPage() {
  const router = useRouter()

  const [partial, setPartial] = useState<{
    selectedRole?: ApiUserRole
    fullName?: string
    email?: string
    phoneNumber?: string
    password?: string
  } | null>(null)

  const [universities, setUniversities] = useState<UniversityReadDto[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState('')
  const [minBudget, setMinBudget] = useState<number | ''>('')
  const [maxBudget, setMaxBudget] = useState<number | ''>('')
  const [requiredCapacity, setRequiredCapacity] = useState<number | ''>('')
  const [amenities, setAmenities] = useState<AmenityReadDto[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [priorityOrder, setPriorityOrder] = useState<PriorityKey[]>(['price', 'distance', 'rating'])
  const [draggingPriority, setDraggingPriority] = useState<PriorityKey | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('signup_partial')
      if (!raw) {
        router.replace('/signup')
        return
      }
      const parsed = JSON.parse(raw)
      if (!parsed || parsed.selectedRole !== ApiUserRole.Student) {
        router.replace('/signup')
        return
      }
      setPartial(parsed)
    } catch {
      router.replace('/signup')
    }
  }, [router])

  useEffect(() => {
    let cancelled = false
    async function loadUniversities() {
      try {
        const list = await UniversitiesApi.list()
        if (!cancelled) setUniversities(list)
      } catch {
        if (!cancelled) setUniversities([])
      }
    }
    loadUniversities()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAmenities() {
      try {
        const list = await AmenitiesApi.list()
        if (!cancelled) setAmenities(list)
      } catch {
        if (!cancelled) setAmenities([])
      }
    }
    loadAmenities()
    return () => {
      cancelled = true
    }
  }, [])

  const resolvedPriorityWeights = useMemo(() => {
    const result: Record<PriorityKey, number> = {
      price: 0,
      distance: 0,
      rating: 0,
    }
    priorityOrder.forEach((priority, index) => {
      result[priority] = PRIORITY_WEIGHTS_BY_POSITION[index] ?? 0
    })
    return result
  }, [priorityOrder])

  function buildStudentPreferencesPayload() {
    return {
      universityId: selectedUniversityId,
      minBudget: minBudget === '' ? null : Number(minBudget),
      maxBudget: maxBudget === '' ? null : Number(maxBudget),
      requiredCapacity: requiredCapacity === '' ? null : Number(requiredCapacity),
      selectedAmenities,
      priorityOrder,
      weights: {
        price: resolvedPriorityWeights.price,
        distance: resolvedPriorityWeights.distance,
        rating: resolvedPriorityWeights.rating,
      },
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!partial) return
    if (!selectedUniversityId) {
      setError('Select a university to continue.')
      return
    }

    setSubmitting(true)
    try {
      const tokens = await AuthApi.register({
        fullName: partial.fullName ?? '',
        email: partial.email ?? '',
        phoneNumber: partial.phoneNumber ?? '',
        password: partial.password ?? '',
        role: ApiUserRole.Student,
      })

      // cleanup partial
      try {
        sessionStorage.removeItem('signup_partial')
      } catch {}

      setAuthSession(tokens, { persistent: true })

      await StudentPreferencesApi.upsertMe(buildStudentPreferencesPayload(), tokens.accessToken)

      const next =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null
      if (next && next.startsWith('/')) {
        router.replace(next)
        return
      }

      router.replace('/hostels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!partial) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-7 px-4 py-6 sm:px-0 lg:space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Student preferences</h1>
        <p className="text-sm text-gray-600">Tell us about your accommodation needs.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Onboarding failed</p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <StudentPreferencesFields
          submitting={submitting}
          studentStep={2}
          selectedUniversityId={selectedUniversityId}
          universities={universities}
          minBudget={minBudget}
          maxBudget={maxBudget}
          requiredCapacity={requiredCapacity}
          amenities={amenities}
          selectedAmenities={selectedAmenities}
          maxAmenitiesSelection={MAX_AMENITIES_SELECTION}
          priorityOrder={priorityOrder}
          priorityLabels={PRIORITY_LABELS}
          resolvedPriorityWeights={resolvedPriorityWeights}
          onUniversityChange={setSelectedUniversityId}
          onMinBudgetChange={setMinBudget}
          onMaxBudgetChange={setMaxBudget}
          onRequiredCapacityChange={setRequiredCapacity}
          onToggleAmenity={(amenityName) => {
            setSelectedAmenities((prev) => {
              if (prev.includes(amenityName)) {
                return prev.filter((item) => item !== amenityName)
              }
              if (prev.length >= MAX_AMENITIES_SELECTION) {
                return prev
              }
              return [...prev, amenityName]
            })
          }}
          onDragStartPriority={setDraggingPriority}
          onDropPriority={(priority) => {
            if (!draggingPriority || draggingPriority === priority) return
            setPriorityOrder((prev) => {
              const withoutDragging = prev.filter((item) => item !== draggingPriority)
              const targetIndex = withoutDragging.indexOf(priority)
              withoutDragging.splice(targetIndex, 0, draggingPriority)
              return withoutDragging
            })
            setDraggingPriority(null)
          }}
          onDragEndPriority={() => setDraggingPriority(null)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/signup')}
            disabled={submitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>

      <div className="pt-2 text-center text-sm text-gray-600">
        <p>
          Want to change your account details?{' '}
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="font-semibold text-amber-700 hover:underline"
          >
            Edit
          </button>
        </p>
      </div>
    </div>
  )
}
