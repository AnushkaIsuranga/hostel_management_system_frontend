'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { UniversitiesApi } from '@/lib/backendApi'
import { buildGoogleMapsQueryUrl, isGoogleMapsUrl, tryExtractCoordinates } from '@/lib/location'
import type { UniversityCreateDto, UniversityReadDto, UniversityUpdateDto } from '@/types/backend'

type DrawerMode = 'create' | 'edit'
type UniversityFormState = {
  name: string
  locationUrl: string
}

export default function Page() {
  const [universities, setUniversities] = useState<UniversityReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [activeUniversity, setActiveUniversity] = useState<UniversityReadDto | null>(null)
  const [closing, setClosing] = useState(false)

  const [form, setForm] = useState<UniversityFormState>({
    name: '',
    locationUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setUniversities(await UniversitiesApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load universities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return universities
    return universities.filter((u) => u.name.toLowerCase().includes(q))
  }, [universities, query])

  function openCreate() {
    setDrawerMode('create')
    setActiveUniversity(null)
    setForm({
      name: '',
      locationUrl: '',
    })
    setFormError(null)
    setDrawerOpen(true)
  }

  function openEdit(university: UniversityReadDto) {
    setDrawerMode('edit')
    setActiveUniversity(university)
    setForm({
      name: university.name,
      locationUrl: buildGoogleMapsQueryUrl(university.latitude, university.longitude),
    })
    setFormError(null)
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
      if (!form.name.trim()) {
        setFormError('Name is required')
        return
      }

      const locationUrl = form.locationUrl.trim()
      if (!locationUrl) {
        setFormError('Location URL is required.')
        return
      }

      if (!isGoogleMapsUrl(locationUrl)) {
        setFormError('Invalid Google Maps URL.')
        return
      }

      const parsed = tryExtractCoordinates(locationUrl)

      const payload: UniversityCreateDto = {
        name: form.name.trim(),
        latitude: parsed?.latitude,
        longitude: parsed?.longitude,
        locationUrl,
      }

      if (drawerMode === 'create') {
        await UniversitiesApi.create(payload)
      } else {
        if (!activeUniversity) throw new Error('No university selected')
        const dto: UniversityUpdateDto = { ...payload }
        await UniversitiesApi.update(activeUniversity.id, dto)
      }

      await reload()
      closeDrawer()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save university')
    } finally {
      setSaving(false)
    }
  }

  async function remove(university: UniversityReadDto) {
    const ok = window.confirm(`Delete university "${university.name}"?`)
    if (!ok) return
    try {
      await UniversitiesApi.remove(university.id)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete university')
    }
  }

  return (
    <div className="space-y-6">
      <header className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Universities</h1>
            <p className="mt-1 text-sm text-gray-600">
              CRUD via `GET/POST/PUT/DELETE /api/universities`
            </p>
          </div>
          <button onClick={openCreate} className="accent-btn px-5 py-2.5 text-sm font-semibold">
            New University
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
            placeholder="Search by name"
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
                <th className="px-3 py-2">Latitude</th>
                <th className="px-3 py-2">Longitude</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={4}>
                    No universities found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="px-3 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-3 py-3 text-gray-700">{u.latitude}</td>
                    <td className="px-3 py-3 text-gray-700">{u.longitude}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(u)}
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
                    {drawerMode === 'create' ? 'Create University' : 'Edit University'}
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

                <div className="grid grid-cols-1 gap-4">
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
                      Location URL
                    </label>
                    <input
                      value={form.locationUrl}
                      onChange={(e) => setForm((p) => ({ ...p, locationUrl: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      placeholder="https://maps.google.com/?q=6.9271,79.8612"
                    />
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
