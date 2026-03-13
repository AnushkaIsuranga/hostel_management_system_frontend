'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { getAccessToken } from '@/lib/auth'
import {
  AmenitiesApi,
  ApiError,
  HostelAmenitiesApi,
  HostelImagesApi,
  HostelsApi,
} from '@/lib/backendApi'
import { buildGoogleMapsQueryUrl, isGoogleMapsUrl, tryExtractCoordinates } from '@/lib/location'
import {
  ApiHostelStatus,
  type AmenityReadDto,
  type HostelCreateDto,
  type HostelImageReadDto,
  type HostelReadDto,
  type HostelUpdateDto,
} from '@/types/backend'

const MAX_HOSTEL_IMAGES = 8
const MAX_VISIBLE_AMENITIES = 10

function hostelStatusLabel(status: ApiHostelStatus): string {
  switch (status) {
    case ApiHostelStatus.Pending:
      return 'Pending'
    case ApiHostelStatus.Active:
      return 'Active'
    case ApiHostelStatus.Disabled:
      return 'Disabled'
    default:
      return String(status)
  }
}

type DrawerMode = 'create' | 'edit'

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

export default function Page() {
  const [hostels, setHostels] = useState<HostelReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [activeHostel, setActiveHostel] = useState<HostelReadDto | null>(null)
  const [closing, setClosing] = useState(false)

  const [form, setForm] = useState<HostelCreateDto>({
    name: '',
    description: '',
    city: '',
    address: '',
    googleMapsUrl: '',
    minPrice: 0,
    maxPrice: 0,
    genderPolicy: '',
    status: ApiHostelStatus.Pending,
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [amenities, setAmenities] = useState<AmenityReadDto[]>([])
  const [amenityQuery, setAmenityQuery] = useState('')
  const [selectedAmenityNames, setSelectedAmenityNames] = useState<string[]>([])
  const [currentAmenityIds, setCurrentAmenityIds] = useState<string[]>([])
  const [loadingAmenities, setLoadingAmenities] = useState(true)
  const [existingImages, setExistingImages] = useState<HostelImageReadDto[]>([])
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  useEffect(() => {
    const previewUrls = selectedImageFiles.map((file) => URL.createObjectURL(file))
    setSelectedImagePreviews(previewUrls)

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedImageFiles])

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const list = await HostelsApi.list()
      setHostels(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return hostels
    return hostels.filter((h) => {
      return (
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)
      )
    })
  }, [hostels, query])

  const visibleAmenities = useMemo(() => {
    const q = normalizeAmenitySearchValue(amenityQuery)
    const selectedAmenitySet = new Set(
      selectedAmenityNames.map((name) => normalizeAmenitySearchValue(name)),
    )

    const amenityOptions = amenities.map((amenity) => ({
      id: amenity.id,
      name: amenity.name,
      normalizedName: normalizeAmenitySearchValue(amenity.name),
    }))

    const customSelectedAmenities = selectedAmenityNames
      .map((name, index) => ({
        id: `custom-${normalizeAmenitySearchValue(name)}-${index}`,
        name: normalizeAmenityName(name),
        normalizedName: normalizeAmenitySearchValue(name),
      }))
      .filter(
        (customAmenity) =>
          !amenityOptions.some(
            (amenity) => amenity.normalizedName === customAmenity.normalizedName,
          ),
      )

    const combinedAmenities = [...amenityOptions, ...customSelectedAmenities]

    const filteredAmenities = combinedAmenities.filter((amenity) => {
      if (!q) return true
      return amenity.normalizedName.includes(q)
    })

    filteredAmenities.sort((a, b) => {
      const aSelected = selectedAmenitySet.has(a.normalizedName)
      const bSelected = selectedAmenitySet.has(b.normalizedName)
      if (aSelected !== bSelected) return aSelected ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return filteredAmenities.slice(0, MAX_VISIBLE_AMENITIES)
  }, [amenities, amenityQuery, selectedAmenityNames])

  const canCreateAmenityFromQuery = useMemo(() => {
    const normalized = normalizeAmenitySearchValue(amenityQuery)
    if (!normalized) return false
    return (
      !amenities.some((amenity) => normalizeAmenitySearchValue(amenity.name) === normalized) &&
      !selectedAmenityNames.some((name) => normalizeAmenitySearchValue(name) === normalized)
    )
  }, [amenities, amenityQuery, selectedAmenityNames])

  function openCreate() {
    setDrawerMode('create')
    setActiveHostel(null)
    setForm({
      name: '',
      description: '',
      city: '',
      address: '',
      googleMapsUrl: '',
      minPrice: 0,
      maxPrice: 0,
      genderPolicy: '',
      status: ApiHostelStatus.Pending,
    })
    setFormError(null)
    setAmenityQuery('')
    setSelectedAmenityNames([])
    setCurrentAmenityIds([])
    setExistingImages([])
    setSelectedImageFiles([])
    setLoadingImages(false)
    setDrawerOpen(true)
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

  function openEdit(hostel: HostelReadDto) {
    setDrawerMode('edit')
    setActiveHostel(hostel)
    setForm({
      name: hostel.name,
      description: hostel.description,
      city: hostel.city,
      address: hostel.address,
      googleMapsUrl:
        hostel.googleMapsUrl?.trim() || buildGoogleMapsQueryUrl(hostel.latitude, hostel.longitude),
      minPrice: hostel.minPrice,
      maxPrice: hostel.maxPrice,
      genderPolicy: hostel.genderPolicy,
      status: hostel.status,
    })
    setFormError(null)
    setAmenityQuery('')
    setSelectedAmenityNames([])
    setCurrentAmenityIds([])
    setSelectedImageFiles([])
    void loadHostelImages(hostel.id)
    void loadHostelAmenities(hostel.id)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setClosing(true)
    window.setTimeout(() => {
      setDrawerOpen(false)
      setClosing(false)
      setFormError(null)
    }, 220)
  }

  async function submit() {
    setSaving(true)
    setFormError(null)
    try {
      const token = getAccessToken()
      const resolvedMapsUrl = form.googleMapsUrl?.trim() ?? ''

      if (!resolvedMapsUrl) {
        setFormError('Google Maps URL is required.')
        return
      }

      if (!isGoogleMapsUrl(resolvedMapsUrl)) {
        setFormError('Invalid Google Maps URL.')
        return
      }

      if (existingImages.length + selectedImageFiles.length > MAX_HOSTEL_IMAGES) {
        setFormError(`A hostel can have up to ${MAX_HOSTEL_IMAGES} pictures.`)
        return
      }

      if (selectedImageFiles.length > 0 && !token) {
        setFormError('You must be logged in to upload hostel pictures.')
        return
      }

      const extracted = tryExtractCoordinates(resolvedMapsUrl)

      const payload: HostelCreateDto = {
        ...form,
        latitude: extracted?.latitude,
        longitude: extracted?.longitude,
        googleMapsUrl: resolvedMapsUrl || null,
      }

      let savedHostelId = activeHostel?.id

      if (drawerMode === 'create') {
        const createdHostel = await HostelsApi.create(payload)
        savedHostelId = createdHostel.id
      } else {
        if (!activeHostel) throw new Error('No hostel selected')
        const dto: HostelUpdateDto = {
          ...payload,
          ownerId: activeHostel.ownerId,
        }
        await HostelsApi.update(activeHostel.id, dto)
        savedHostelId = activeHostel.id
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
        if (drawerMode === 'edit' && currentAmenityIdSet.has(amenityId)) {
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

      if (drawerMode === 'edit') {
        for (const amenityId of currentAmenityIds) {
          if (selectedAmenityIdSet.has(amenityId)) continue
          await HostelAmenitiesApi.remove(savedHostelId, amenityId)
        }
      }

      setCurrentAmenityIds(selectedAmenityIds)

      if (selectedImageFiles.length > 0) {
        if (!token) {
          setFormError('You must be logged in to upload hostel pictures.')
          return
        }

        for (let index = 0; index < selectedImageFiles.length; index += 1) {
          await Promise.all(
            selectedImageFiles.map((file, index) =>
              HostelImagesApi.upload(savedHostelId, file, token, existingImages.length + index),
            ),
          )
        }

        setSelectedImageFiles([])
        await loadHostelImages(savedHostelId)
      }

      await reload()
      closeDrawer()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save hostel')
    } finally {
      setSaving(false)
    }
  }

  async function remove(hostel: HostelReadDto) {
    const ok = window.confirm(`Delete hostel "${hostel.name}"?`)
    if (!ok) return
    try {
      await HostelsApi.remove(hostel.id)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete hostel')
    }
  }

  async function removeExistingImage(imageId: string) {
    const token = getAccessToken()
    const hostelId = activeHostel?.id
    if (!token) {
      setFormError('You must be logged in to remove hostel pictures.')
      return
    }
    if (!hostelId) {
      setFormError('No hostel selected')
      return
    }

    try {
      await HostelImagesApi.remove(imageId, token)
      await loadHostelImages(hostelId)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to remove image')
    }
  }

  async function onSelectImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const availableSlots = MAX_HOSTEL_IMAGES - existingImages.length - selectedImageFiles.length
    if (availableSlots <= 0) {
      setFormError(`A hostel can have up to ${MAX_HOSTEL_IMAGES} pictures.`)
      event.target.value = ''
      return
    }

    const filesToAdd = files.slice(0, availableSlots)
    if (files.length > filesToAdd.length) {
      setFormError(`Only ${MAX_HOSTEL_IMAGES} pictures are allowed per hostel.`)
    }

    setSelectedImageFiles((prev) => [...prev, ...filesToAdd])
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <header className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hostels</h1>
          </div>
          <button onClick={openCreate} className="accent-btn px-5 py-2.5 text-sm font-semibold">
            New Hostel
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </header>

      <div className="surface-card p-4">
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, city, address"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={reload}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={5}>
                    No hostels found.
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="border-b border-gray-100">
                    <td className="px-3 py-3 font-medium text-gray-900">{h.name}</td>
                    <td className="px-3 py-3 text-gray-700">{h.city}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {Number(h.minPrice).toLocaleString()} – {Number(h.maxPrice).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className="badge bg-amber-100 text-amber-800">
                        {hostelStatusLabel(h.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(h)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(h)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 ${closing ? 'overlay-exit' : 'overlay-enter'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-xl ${
              closing ? 'drawer-exit' : 'drawer-enter'
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-gray-200 p-5">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {drawerMode}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {drawerMode === 'create' ? 'Create Hostel' : 'Edit Hostel'}
                  </h2>
                </div>
                <button
                  onClick={closeDrawer}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto p-5">
                {formError && (
                  <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">City</label>
                      <input
                        value={form.city}
                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            status: Number(e.target.value) as ApiHostelStatus,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={ApiHostelStatus.Pending}>Pending</option>
                        <option value={ApiHostelStatus.Active}>Active</option>
                        <option value={ApiHostelStatus.Disabled}>Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Address
                    </label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Min Price
                      </label>
                      <input
                        type="number"
                        value={form.minPrice}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, minPrice: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Max Price
                      </label>
                      <input
                        type="number"
                        value={form.maxPrice}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, maxPrice: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Gender Policy
                    </label>
                    <input
                      value={form.genderPolicy}
                      onChange={(e) => setForm((p) => ({ ...p, genderPolicy: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Google Maps URL
                    </label>
                    <input
                      value={form.googleMapsUrl ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, googleMapsUrl: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      placeholder="https://maps.google.com/?q=6.9271,79.8612"
                    />
                  </div>

                  <div className="space-y-5 rounded-xl border border-gray-200 p-4">
                    <div className="space-y-3">
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Pictures (up to {MAX_HOSTEL_IMAGES})
                      </label>

                      {drawerMode === 'edit' && (
                        <div className="mb-3 rounded-lg border border-gray-200 p-2">
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
                        onChange={onSelectImageFiles}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-amber-800"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {existingImages.length + selectedImageFiles.length}/{MAX_HOSTEL_IMAGES}{' '}
                        selected.
                      </p>

                      {selectedImageFiles.length > 0 && (
                        <div className="mt-3 rounded-lg border border-gray-200 p-2">
                          <p className="mb-2 text-xs font-semibold text-gray-600">
                            Preview before upload
                          </p>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {selectedImageFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="overflow-hidden rounded-md border border-gray-200"
                              >
                                <div className="relative h-20 w-full bg-gray-50">
                                  <Image
                                    src={selectedImagePreviews[index] ?? ''}
                                    alt={`Preview ${file.name}`}
                                    fill
                                    sizes="120px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedImageFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
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

                    <div className="space-y-3 border-t border-gray-200 pt-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">
                          Amenities
                        </label>
                        <input
                          value={amenityQuery}
                          onChange={(e) => setAmenityQuery(e.target.value)}
                          placeholder="Search amenities"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

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
                          className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                        >
                          Add new amenity &quot;{normalizeAmenityName(amenityQuery)}&quot;
                        </button>
                      )}

                      <div className="max-h-36 space-y-1 overflow-auto rounded-lg border border-gray-200 p-2">
                        {loadingAmenities ? (
                          <p className="text-xs text-gray-500">Loading amenities…</p>
                        ) : visibleAmenities.length === 0 ? (
                          <p className="text-xs text-gray-500">No amenities found.</p>
                        ) : (
                          visibleAmenities.map((amenity) => {
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

                      <p className="text-xs text-gray-500">
                        Showing up to {MAX_VISIBLE_AMENITIES} amenities. Selected items appear
                        first.
                      </p>

                      {selectedAmenityNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
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
                </div>
              </div>

              <div className="border-t border-gray-200 p-5">
                <button
                  onClick={submit}
                  disabled={saving}
                  className="accent-btn w-full px-5 py-2.5 text-sm font-semibold"
                >
                  {saving ? 'Saving…' : drawerMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
