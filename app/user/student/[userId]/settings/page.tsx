'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AmenitiesApi, StudentPreferencesApi, UniversitiesApi, UsersApi } from '@/lib/backendApi'
import StudentPreferencesFields from '@/components/auth/StudentPreferencesFields'
import type {
  AmenityReadDto,
  StudentPreferenceReadDto,
  UniversityReadDto,
  UserReadDto,
  UserUpdateDto,
} from '@/types/backend'

type PriorityKey = 'price' | 'distance' | 'rating'

const PRIORITY_LABELS: Record<PriorityKey, string> = {
  price: 'Price',
  distance: 'Distance',
  rating: 'Rating',
}

const PRIORITY_WEIGHTS_BY_POSITION = [0.5, 0.3, 0.2]
const MAX_AMENITIES_SELECTION = 10
const DEFAULT_PRIORITY_ORDER: PriorityKey[] = ['price', 'distance', 'rating']

export default function StudentSettingsPage() {
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [user, setUser] = useState<UserReadDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [universities, setUniversities] = useState<UniversityReadDto[]>([])
  const [amenities, setAmenities] = useState<AmenityReadDto[]>([])

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedUniversityId, setSelectedUniversityId] = useState('')
  const [minBudget, setMinBudget] = useState<number | ''>('')
  const [maxBudget, setMaxBudget] = useState<number | ''>('')
  const [requiredCapacity, setRequiredCapacity] = useState<number | ''>('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [priorityOrder, setPriorityOrder] = useState<PriorityKey[]>(DEFAULT_PRIORITY_ORDER)
  const [draggingPriority, setDraggingPriority] = useState<PriorityKey | null>(null)

  const title = useMemo(() => {
    if (!user) return 'Profile settings'
    return user.fullName || user.email
  }, [user])

  useEffect(() => {
    async function load() {
      try {
        setError(null)
        if (!userId) return

        const [userRes, universitiesRes, amenitiesRes] = await Promise.all([
          UsersApi.get(userId),
          UniversitiesApi.list().catch(() => []),
          AmenitiesApi.list().catch(() => []),
        ])

        setUser(userRes)
        setFullName(userRes.fullName ?? '')
        setPhoneNumber(userRes.phoneNumber ?? '')
        setUniversities(universitiesRes)
        setAmenities(amenitiesRes)

        try {
          const preference = await StudentPreferencesApi.getMe()
          applyStudentPreference(preference)
        } catch {
          // Preference may not exist yet for newly-created accounts.
        } finally {
          setLoadingPreferences(false)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

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

  function applyStudentPreference(preference: StudentPreferenceReadDto) {
    setSelectedUniversityId(preference.universityId ?? '')
    setMinBudget(preference.minBudget ?? '')
    setMaxBudget(preference.maxBudget ?? '')
    setRequiredCapacity(preference.requiredCapacity ?? '')
    setSelectedAmenities(preference.selectedAmenities ?? [])

    const normalizedOrder = normalizePriorityOrder(preference.priorityOrder)
    setPriorityOrder(normalizedOrder)
  }

  function normalizePriorityOrder(order: string[] | null | undefined): PriorityKey[] {
    const seen = new Set<PriorityKey>()
    const next: PriorityKey[] = []

    for (const item of order ?? []) {
      if (item === 'price' || item === 'distance' || item === 'rating') {
        if (!seen.has(item)) {
          seen.add(item)
          next.push(item)
        }
      }
    }

    for (const key of DEFAULT_PRIORITY_ORDER) {
      if (!seen.has(key)) next.push(key)
    }

    return next
  }

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

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!selectedUniversityId) {
      setError('Select a university before saving preferences.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (!user) {
        setError('User not loaded')
        return
      }

      const payload: UserUpdateDto = {
        fullName: fullName.trim() || user.fullName,
        phoneNumber: phoneNumber.trim() || user.phoneNumber,
        role: user.role,
      }

      await Promise.all([
        UsersApi.update(userId, payload),
        StudentPreferencesApi.upsertMe(buildStudentPreferencesPayload()),
      ])

      router.replace(`/user/student/${userId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="mt-1 text-sm text-gray-600">Student settings</div>
        </div>

        {userId ? (
          <Link
            href={`/user/student/${userId}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        ) : null}
      </div>

      <form
        onSubmit={onSave}
        className="mt-6 grid max-w-3xl gap-6 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>

          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              placeholder="Your full name"
            />
          </Field>

          <Field label="Phone">
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              placeholder="Phone number"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Recommendation preferences</h2>

          {loadingPreferences ? (
            <div className="text-sm text-gray-600">Loading preferences...</div>
          ) : (
            <StudentPreferencesFields
              submitting={saving}
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
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={saving}
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {userId ? (
            <Link
              href={`/user/student/${userId}`}
              className="text-sm text-gray-700 hover:underline"
            >
              Cancel
            </Link>
          ) : null}
        </div>

        <div className="text-xs text-gray-500">
          Student profile and recommendation preferences are saved together.
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {children}
    </label>
  )
}
