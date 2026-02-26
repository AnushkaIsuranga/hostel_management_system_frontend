'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { HostelsApi, UsersApi } from '@/lib/backendApi'
import { ApiHostelStatus } from '@/types/backend'
import type {
  HostelCreateDto,
  HostelReadDto,
  HostelUpdateDto,
  UserReadDto,
  UserUpdateDto,
} from '@/types/backend'

export default function OwnerSettingsPage() {
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [user, setUser] = useState<UserReadDto | null>(null)
  const [hostels, setHostels] = useState<HostelReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingHostel, setSavingHostel] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [hostelName, setHostelName] = useState('')
  const [hostelDescription, setHostelDescription] = useState('')
  const [hostelCity, setHostelCity] = useState('')
  const [hostelAddress, setHostelAddress] = useState('')
  const [hostelMinPrice, setHostelMinPrice] = useState<number>(0)
  const [hostelMaxPrice, setHostelMaxPrice] = useState<number>(0)
  const [hostelGenderPolicy, setHostelGenderPolicy] = useState('Any')
  const [hostelLocationUrl, setHostelLocationUrl] = useState('')
  const [hostelStatus, setHostelStatus] = useState<ApiHostelStatus>(ApiHostelStatus.Pending)
  const [editingHostelId, setEditingHostelId] = useState<string | null>(null)

  const title = useMemo(() => {
    if (!user) return 'Owner settings'
    return user.fullName || user.email
  }, [user])

  useEffect(() => {
    async function load() {
      try {
        setError(null)
        if (!userId) return

        const [u, hs] = await Promise.all([UsersApi.get(userId), HostelsApi.list()])
        setUser(u)
        setFullName(u.fullName ?? '')
        setPhoneNumber(u.phoneNumber ?? '')

        setHostels(hs)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load owner settings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSavingProfile(true)
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
      await UsersApi.update(userId, payload)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  function startEditHostel(h: HostelReadDto) {
    setEditingHostelId(h.id)
    setHostelName(h.name)
    setHostelDescription(h.description)
    setHostelCity(h.city)
    setHostelAddress(h.address)
    setHostelMinPrice(h.minPrice)
    setHostelMaxPrice(h.maxPrice)
    setHostelGenderPolicy(h.genderPolicy)
    setHostelLocationUrl(h.locationUrl)
    setHostelStatus(h.status)
  }

  function resetHostelForm() {
    setEditingHostelId(null)
    setHostelName('')
    setHostelDescription('')
    setHostelCity('')
    setHostelAddress('')
    setHostelMinPrice(0)
    setHostelMaxPrice(0)
    setHostelGenderPolicy('Any')
    setHostelLocationUrl('')
    setHostelStatus(ApiHostelStatus.Pending)
  }

  async function onSaveHostel(e: React.FormEvent) {
    e.preventDefault()
    setSavingHostel(true)
    setError(null)
    try {
      if (!hostelName.trim() || !hostelCity.trim() || !hostelAddress.trim()) {
        setError('Name, city, and address are required')
        return
      }
      if (hostelMinPrice < 0 || hostelMaxPrice < 0 || hostelMaxPrice < hostelMinPrice) {
        setError('Prices must be valid (max >= min)')
        return
      }
      if (!hostelDescription.trim()) {
        setError('Description is required')
        return
      }

      if (editingHostelId) {
        const payload: HostelUpdateDto = {
          name: hostelName.trim(),
          description: hostelDescription.trim(),
          city: hostelCity.trim(),
          address: hostelAddress.trim(),
          minPrice: hostelMinPrice,
          maxPrice: hostelMaxPrice,
          genderPolicy: hostelGenderPolicy.trim() || 'Any',
          locationUrl: hostelLocationUrl.trim() || '',
          status: hostelStatus,
        }
        await HostelsApi.update(editingHostelId, payload)
      } else {
        const payload: HostelCreateDto = {
          name: hostelName.trim(),
          description: hostelDescription.trim(),
          city: hostelCity.trim(),
          address: hostelAddress.trim(),
          minPrice: hostelMinPrice,
          maxPrice: hostelMaxPrice,
          genderPolicy: hostelGenderPolicy.trim() || 'Any',
          locationUrl: hostelLocationUrl.trim() || '',
          status: hostelStatus,
        }
        await HostelsApi.create(payload)
      }

      resetHostelForm()
      const hs = await HostelsApi.list()
      setHostels(hs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save hostel')
    } finally {
      setSavingHostel(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="mt-1 text-sm text-gray-600">Owner settings</div>
        </div>

        {userId ? (
          <Link
            href={`/user/owner/${userId}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        ) : null}
      </div>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid gap-6">
        <section className="grid max-w-xl gap-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Profile</div>
          <form onSubmit={onSaveProfile} className="grid gap-4">
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

            <div className="flex items-center gap-3">
              <button
                disabled={savingProfile}
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
              {userId ? (
                <Link
                  href={`/user/owner/${userId}`}
                  className="text-sm text-gray-700 hover:underline"
                >
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Hostels</div>

          <form onSubmit={onSaveHostel} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="Hostel name"
                />
              </Field>

              <Field label="City">
                <input
                  value={hostelCity}
                  onChange={(e) => setHostelCity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="City"
                />
              </Field>
            </div>

            <Field label="Address">
              <input
                value={hostelAddress}
                onChange={(e) => setHostelAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                placeholder="Street / area"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={hostelDescription}
                onChange={(e) => setHostelDescription(e.target.value)}
                className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                placeholder="Optional description"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Min price">
                <input
                  type="number"
                  value={Number.isFinite(hostelMinPrice) ? hostelMinPrice : 0}
                  onChange={(e) => setHostelMinPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </Field>

              <Field label="Max price">
                <input
                  type="number"
                  value={Number.isFinite(hostelMaxPrice) ? hostelMaxPrice : 0}
                  onChange={(e) => setHostelMaxPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Gender policy">
                <input
                  value={hostelGenderPolicy}
                  onChange={(e) => setHostelGenderPolicy(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="Any / Male / Female"
                />
              </Field>

              <Field label="Map URL">
                <input
                  value={hostelLocationUrl}
                  onChange={(e) => setHostelLocationUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="https://..."
                />
              </Field>
            </div>

            <Field label="Status">
              <select
                value={hostelStatus}
                onChange={(e) => setHostelStatus(Number(e.target.value) as ApiHostelStatus)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value={ApiHostelStatus.Pending}>Pending</option>
                <option value={ApiHostelStatus.Active}>Active</option>
                <option value={ApiHostelStatus.Disabled}>Disabled</option>
              </select>
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={savingHostel}
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingHostel ? 'Saving…' : editingHostelId ? 'Save changes' : 'Submit hostel'}
              </button>

              {editingHostelId ? (
                <button
                  type="button"
                  onClick={resetHostelForm}
                  className="text-sm text-gray-700 hover:underline"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="text-xs text-gray-500">Owners can submit and edit hostels.</div>
          </form>

          <div className="mt-2 grid gap-2">
            {hostels.length === 0 ? (
              <div className="text-sm text-gray-600">No hostels found.</div>
            ) : (
              hostels.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{h.name}</div>
                    <div className="truncate text-xs text-gray-600">{h.city}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEditHostel(h)}
                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
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
