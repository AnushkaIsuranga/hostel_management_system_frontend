'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { HostelsApi } from '@/lib/backendApi'
import {
  ApiHostelStatus,
  type HostelCreateDto,
  type HostelReadDto,
  type HostelUpdateDto,
} from '@/types/backend'

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
    minPrice: 0,
    maxPrice: 0,
    genderPolicy: '',
    locationUrl: '',
    status: ApiHostelStatus.Pending,
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  function openCreate() {
    setDrawerMode('create')
    setActiveHostel(null)
    setForm({
      name: '',
      description: '',
      city: '',
      address: '',
      minPrice: 0,
      maxPrice: 0,
      genderPolicy: '',
      locationUrl: '',
      status: ApiHostelStatus.Pending,
    })
    setFormError(null)
    setDrawerOpen(true)
  }

  function openEdit(hostel: HostelReadDto) {
    setDrawerMode('edit')
    setActiveHostel(hostel)
    setForm({
      name: hostel.name,
      description: hostel.description,
      city: hostel.city,
      address: hostel.address,
      minPrice: hostel.minPrice,
      maxPrice: hostel.maxPrice,
      genderPolicy: hostel.genderPolicy,
      locationUrl: hostel.locationUrl,
      status: hostel.status,
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
      if (drawerMode === 'create') {
        await HostelsApi.create(form)
      } else {
        if (!activeHostel) throw new Error('No hostel selected')
        const dto: HostelUpdateDto = { ...form }
        await HostelsApi.update(activeHostel.id, dto)
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

  return (
    <div className="space-y-6">
      <header className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hostels</h1>
            <p className="mt-1 text-sm text-gray-600">
              CRUD via `GET/POST/PUT/DELETE /api/hostels`
            </p>
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
                      Location URL
                    </label>
                    <input
                      value={form.locationUrl}
                      onChange={(e) => setForm((p) => ({ ...p, locationUrl: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
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
