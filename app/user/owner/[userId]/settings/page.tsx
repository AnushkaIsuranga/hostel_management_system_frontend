'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import {
  AmenitiesApi,
  ApiError,
  HostelAmenitiesApi,
  HostelImagesApi,
  HostelsApi,
  UsersApi,
} from '@/lib/backendApi'
import { buildGoogleMapsQueryUrl, isGoogleMapsUrl, tryExtractCoordinates } from '@/lib/location'
import { ApiHostelStatus } from '@/types/backend'
import type {
  AmenityReadDto,
  HostelCreateDto,
  HostelImageReadDto,
  HostelReadDto,
  HostelUpdateDto,
  UserReadDto,
  UserUpdateDto,
} from '@/types/backend'

const MAX_HOSTEL_IMAGES = 8

function normalizeAmenityName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeAmenitySearchValue(value: string): string {
  return normalizeAmenityName(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

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
  const [hostelGoogleMapsUrl, setHostelGoogleMapsUrl] = useState('')
  const [hostelStatus, setHostelStatus] = useState<ApiHostelStatus>(ApiHostelStatus.Pending)
  const [editingHostelId, setEditingHostelId] = useState<string | null>(null)
  const [amenities, setAmenities] = useState<AmenityReadDto[]>([])
  const [amenityQuery, setAmenityQuery] = useState('')
  const [selectedAmenityNames, setSelectedAmenityNames] = useState<string[]>([])
  const [currentAmenityIds, setCurrentAmenityIds] = useState<string[]>([])
  const [loadingAmenities, setLoadingAmenities] = useState(true)
  const [existingImages, setExistingImages] = useState<HostelImageReadDto[]>([])
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

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

  useEffect(() => {
    let cancelled = false

    async function loadAmenities() {
      setLoadingAmenities(true)
      try {
        const list = await AmenitiesApi.list()
        if (!cancelled) setAmenities(list)
      } catch {
        if (!cancelled) setAmenities([])
      } finally {
        if (!cancelled) setLoadingAmenities(false)
      }
    }

    loadAmenities()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredAmenities = useMemo(() => {
    const q = normalizeAmenitySearchValue(amenityQuery)
    if (!q) return amenities
    return amenities.filter((amenity) => normalizeAmenitySearchValue(amenity.name).includes(q))
  }, [amenities, amenityQuery])

  const canCreateAmenityFromQuery = useMemo(() => {
    const normalized = normalizeAmenitySearchValue(amenityQuery)
    if (!normalized) return false
    return !amenities.some((amenity) => normalizeAmenitySearchValue(amenity.name) === normalized)
  }, [amenities, amenityQuery])

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
    setHostelGoogleMapsUrl(
      h.googleMapsUrl?.trim() || buildGoogleMapsQueryUrl(h.latitude, h.longitude),
    )
    setHostelStatus(h.status)
    setAmenityQuery('')
    setSelectedAmenityNames([])
    setCurrentAmenityIds([])
    setSelectedImageFiles([])
    void loadHostelImages(h.id)
    void loadHostelAmenities(h.id)
  }

  async function loadHostelAmenities(hostelId: string) {
    try {
      const links = await HostelAmenitiesApi.list()
      const amenityIds = links
        .filter((link) => link.hostelId === hostelId)
        .map((link) => link.amenityId)
      setCurrentAmenityIds(amenityIds)

      let amenityCatalog = amenities
      if (amenityCatalog.length === 0) {
        amenityCatalog = await AmenitiesApi.list()
        setAmenities(amenityCatalog)
      }

      const names = amenityIds
        .map((amenityId) => amenityCatalog.find((amenity) => amenity.id === amenityId)?.name)
        .filter((name): name is string => Boolean(name))
      setSelectedAmenityNames(names)
    } catch {
      setCurrentAmenityIds([])
      setSelectedAmenityNames([])
    }
  }

  async function loadHostelImages(hostelId: string) {
    setLoadingImages(true)
    try {
      const list = await HostelImagesApi.list(hostelId)
      setExistingImages(list)
    } catch {
      setExistingImages([])
    } finally {
      setLoadingImages(false)
    }
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
    setHostelGoogleMapsUrl('')
    setHostelStatus(ApiHostelStatus.Pending)
    setAmenityQuery('')
    setSelectedAmenityNames([])
    setCurrentAmenityIds([])
    setExistingImages([])
    setSelectedImageFiles([])
    setLoadingImages(false)
    setUploadingImages(false)
  }

  async function onSaveHostel(e: React.FormEvent) {
    e.preventDefault()
    setSavingHostel(true)
    setError(null)
    try {
      const token = getAccessToken()
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

      const mapsUrl = hostelGoogleMapsUrl.trim()

      if (!mapsUrl) {
        setError('Google Maps URL is required.')
        return
      }

      if (!isGoogleMapsUrl(mapsUrl)) {
        setError('Invalid Google Maps URL.')
        return
      }

      if (existingImages.length + selectedImageFiles.length > MAX_HOSTEL_IMAGES) {
        setError(`A hostel can have up to ${MAX_HOSTEL_IMAGES} pictures.`)
        return
      }

      if (selectedImageFiles.length > 0 && !token) {
        setError('You must be logged in to upload hostel pictures.')
        return
      }

      const extracted = tryExtractCoordinates(mapsUrl)

      let savedHostelId = editingHostelId
      const editingHostel = editingHostelId
        ? (hostels.find((hostel) => hostel.id === editingHostelId) ?? null)
        : null

      if (editingHostelId) {
        if (!editingHostel?.ownerId) {
          setError('Invalid owner for selected hostel')
          return
        }

        const payload: HostelUpdateDto = {
          name: hostelName.trim(),
          description: hostelDescription.trim(),
          city: hostelCity.trim(),
          address: hostelAddress.trim(),
          ownerId: editingHostel.ownerId,
          latitude: extracted?.latitude,
          longitude: extracted?.longitude,
          googleMapsUrl: mapsUrl || null,
          minPrice: hostelMinPrice,
          maxPrice: hostelMaxPrice,
          genderPolicy: hostelGenderPolicy.trim() || 'Any',
          status: hostelStatus,
        }
        await HostelsApi.update(editingHostelId, payload)
        savedHostelId = editingHostelId
      } else {
        const payload: HostelCreateDto = {
          name: hostelName.trim(),
          description: hostelDescription.trim(),
          city: hostelCity.trim(),
          address: hostelAddress.trim(),
          latitude: extracted?.latitude,
          longitude: extracted?.longitude,
          googleMapsUrl: mapsUrl || null,
          minPrice: hostelMinPrice,
          maxPrice: hostelMaxPrice,
          genderPolicy: hostelGenderPolicy.trim() || 'Any',
          status: hostelStatus,
        }
        const createdHostel = await HostelsApi.create(payload)
        savedHostelId = createdHostel.id
      }

      if (!savedHostelId) {
        throw new Error('No hostel selected')
      }

      const amenityIds: string[] = []
      for (const selectedName of selectedAmenityNames) {
        const normalized = normalizeAmenityName(selectedName)
        if (!normalized) continue

        const existing = amenities.find(
          (amenity) =>
            normalizeAmenitySearchValue(amenity.name) === normalizeAmenitySearchValue(normalized),
        )

        if (existing) {
          amenityIds.push(existing.id)
          continue
        }

        const createdAmenity = await AmenitiesApi.create({ name: normalized })
        amenityIds.push(createdAmenity.id)
        setAmenities((prev) => {
          if (prev.some((a) => a.id === createdAmenity.id)) return prev
          return [...prev, createdAmenity]
        })
      }

      const selectedAmenityIds = Array.from(new Set(amenityIds))
      const currentAmenityIdSet = new Set(currentAmenityIds)
      const selectedAmenityIdSet = new Set(selectedAmenityIds)

      for (const amenityId of selectedAmenityIds) {
        if (editingHostelId && currentAmenityIdSet.has(amenityId)) {
          continue
        }
        try {
          await HostelAmenitiesApi.create({ hostelId: savedHostelId, amenityId })
        } catch (e) {
          if (!(e instanceof ApiError) || e.status !== 409) {
            throw e
          }
        }
      }

      if (editingHostelId) {
        for (const amenityId of currentAmenityIds) {
          if (selectedAmenityIdSet.has(amenityId)) continue
          await HostelAmenitiesApi.remove(savedHostelId, amenityId)
        }
      }

      setCurrentAmenityIds(selectedAmenityIds)

      if (selectedImageFiles.length > 0 && !editingHostelId) {
        if (!token) {
          setError('You must be logged in to upload hostel pictures.')
          return
        }

        for (let index = 0; index < selectedImageFiles.length; index += 1) {
          const imageFile = selectedImageFiles[index]
          await HostelImagesApi.upload(
            savedHostelId,
            imageFile,
            token,
            existingImages.length + index,
          )
        }
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

  async function removeExistingImage(imageId: string) {
    const token = getAccessToken()
    const hostelId = editingHostelId
    if (!token) {
      setError('You must be logged in to remove hostel pictures.')
      return
    }
    if (!hostelId) {
      setError('No hostel selected')
      return
    }

    try {
      await HostelImagesApi.remove(imageId, token)
      await loadHostelImages(hostelId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove image')
    }
  }

  async function uploadSelectedImages(hostelId: string, files: File[]) {
    const token = getAccessToken()
    if (!token) {
      setError('You must be logged in to upload hostel pictures.')
      return
    }

    if (files.length === 0) return

    setUploadingImages(true)
    try {
      for (let index = 0; index < files.length; index += 1) {
        const imageFile = files[index]
        await HostelImagesApi.upload(hostelId, imageFile, token, existingImages.length + index)
      }
      await loadHostelImages(hostelId)
    } finally {
      setUploadingImages(false)
    }
  }

  async function onSelectImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const availableSlots = MAX_HOSTEL_IMAGES - existingImages.length - selectedImageFiles.length
    if (availableSlots <= 0) {
      setError(`A hostel can have up to ${MAX_HOSTEL_IMAGES} pictures.`)
      event.target.value = ''
      return
    }

    const filesToAdd = files.slice(0, availableSlots)
    if (files.length > filesToAdd.length) {
      setError(`Only ${MAX_HOSTEL_IMAGES} pictures are allowed per hostel.`)
    }

    if (editingHostelId) {
      await uploadSelectedImages(editingHostelId, filesToAdd)
      event.target.value = ''
      return
    }

    setSelectedImageFiles((prev) => [...prev, ...filesToAdd])
    event.target.value = ''
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

              <Field label="Google Maps URL">
                <input
                  value={hostelGoogleMapsUrl}
                  onChange={(e) => setHostelGoogleMapsUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="https://maps.google.com/?q=6.9271,79.8612"
                />
              </Field>
            </div>

            <div className="space-y-3">
              <Field label={`Pictures (up to ${MAX_HOSTEL_IMAGES})`}>
                <div className="space-y-2">
                  {editingHostelId && (
                    <div className="rounded-lg border border-gray-200 p-2">
                      {loadingImages ? (
                        <p className="text-xs text-gray-500">Loading pictures…</p>
                      ) : existingImages.length === 0 ? (
                        <p className="text-xs text-gray-500">No pictures uploaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {existingImages.map((image) => (
                            <div
                              key={image.id}
                              className="overflow-hidden rounded-md border border-gray-200"
                            >
                              <div className="relative h-20 w-full bg-gray-50">
                                <Image
                                  src={image.imageUrl}
                                  alt={image.fileName}
                                  fill
                                  sizes="120px"
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeExistingImage(image.id)}
                                className="w-full border-t border-gray-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImages}
                    onChange={onSelectImageFiles}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-amber-800"
                  />
                  {uploadingImages && <p className="text-xs text-gray-500">Uploading pictures…</p>}
                  <p className="text-xs text-gray-500">
                    {existingImages.length + selectedImageFiles.length}/{MAX_HOSTEL_IMAGES}{' '}
                    selected.
                  </p>

                  {selectedImageFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedImageFiles.map((file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                        >
                          {file.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImageFiles((prev) =>
                                prev.filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                            className="text-gray-500 hover:text-gray-900"
                            aria-label={`Remove ${file.name}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <div className="space-y-3">
                <Field label="Amenities">
                  <input
                    value={amenityQuery}
                    onChange={(e) => setAmenityQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    placeholder="Search amenities"
                  />
                </Field>

                {canCreateAmenityFromQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      const normalized = normalizeAmenityName(amenityQuery)
                      if (!normalized) return
                      setSelectedAmenityNames((prev) => {
                        if (
                          prev.some(
                            (name) =>
                              normalizeAmenitySearchValue(name) ===
                              normalizeAmenitySearchValue(normalized),
                          )
                        ) {
                          return prev
                        }
                        return [...prev, normalized]
                      })
                      setAmenityQuery('')
                    }}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    Add new amenity &quot;{normalizeAmenityName(amenityQuery)}&quot;
                  </button>
                )}

                <div className="max-h-36 space-y-1 overflow-auto rounded-lg border border-gray-200 p-2">
                  {loadingAmenities ? (
                    <p className="text-xs text-gray-500">Loading amenities…</p>
                  ) : filteredAmenities.length === 0 ? (
                    <p className="text-xs text-gray-500">No amenities found.</p>
                  ) : (
                    filteredAmenities.map((amenity) => {
                      const selected = selectedAmenityNames.some(
                        (name) =>
                          normalizeAmenitySearchValue(name) ===
                          normalizeAmenitySearchValue(amenity.name),
                      )
                      return (
                        <label
                          key={amenity.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAmenityNames((prev) => {
                                  if (
                                    prev.some(
                                      (name) =>
                                        normalizeAmenitySearchValue(name) ===
                                        normalizeAmenitySearchValue(amenity.name),
                                    )
                                  ) {
                                    return prev
                                  }
                                  return [...prev, amenity.name]
                                })
                                return
                              }
                              setSelectedAmenityNames((prev) =>
                                prev.filter(
                                  (name) =>
                                    normalizeAmenitySearchValue(name) !==
                                    normalizeAmenitySearchValue(amenity.name),
                                ),
                              )
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">{amenity.name}</span>
                        </label>
                      )
                    })
                  )}
                </div>

                {selectedAmenityNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenityNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
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
