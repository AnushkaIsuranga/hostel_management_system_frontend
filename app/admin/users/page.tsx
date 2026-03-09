'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { UsersApi } from '@/lib/backendApi'
import {
  ApiUserRole,
  type UserCreateDto,
  type UserReadDto,
  type UserUpdateDto,
} from '@/types/backend'

function roleLabel(role: ApiUserRole): string {
  switch (role) {
    case ApiUserRole.Student:
      return 'Student'
    case ApiUserRole.Owner:
      return 'Owner'
    case ApiUserRole.Admin:
      return 'Admin'
    default:
      return String(role)
  }
}

type DrawerMode = 'create' | 'edit'

export default function Page() {
  const [users, setUsers] = useState<UserReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [activeUser, setActiveUser] = useState<UserReadDto | null>(null)
  const [closing, setClosing] = useState(false)

  const [createForm, setCreateForm] = useState<UserCreateDto>({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: ApiUserRole.Student,
  })
  const [updateForm, setUpdateForm] = useState<UserUpdateDto>({
    fullName: '',
    phoneNumber: '',
    role: ApiUserRole.Student,
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setUsers(await UsersApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, query])

  function openCreate() {
    setDrawerMode('create')
    setActiveUser(null)
    setCreateForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      role: ApiUserRole.Student,
    })
    setFormError(null)
    setDrawerOpen(true)
  }

  function openEdit(user: UserReadDto) {
    setDrawerMode('edit')
    setActiveUser(user)
    setUpdateForm({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
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
        await UsersApi.create(createForm)
      } else {
        if (!activeUser) throw new Error('No user selected')
        await UsersApi.update(activeUser.id, updateForm)
      }
      await reload()
      closeDrawer()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  async function remove(user: UserReadDto) {
    const ok = window.confirm(`Delete user "${user.fullName}"?`)
    if (!ok) return
    try {
      await UsersApi.remove(user.id)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      <header className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-sm text-gray-600">CRUD via `GET/POST/PUT/DELETE /api/users`</p>
          </div>
          <button onClick={openCreate} className="accent-btn px-5 py-2.5 text-sm font-semibold">
            New User
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
            placeholder="Search by name or email"
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
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Role</th>
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
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="px-3 py-3 font-medium text-gray-900">{u.fullName}</td>
                    <td className="px-3 py-3 text-gray-700">{u.email}</td>
                    <td className="px-3 py-3 text-gray-700">{u.phoneNumber}</td>
                    <td className="px-3 py-3">
                      <span className="badge bg-amber-100 text-amber-800">{roleLabel(u.role)}</span>
                    </td>
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
                          disabled={ApiUserRole.Admin === u.role}
                          className={
                            `rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100` +
                            (ApiUserRole.Admin === u.role
                              ? ' cursor-not-allowed opacity-50'
                              : ' hover:bg-red-100')
                          }
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
                    {drawerMode === 'create' ? 'Create User' : 'Edit User'}
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

                {drawerMode === 'create' ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Full Name
                      </label>
                      <input
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Email
                      </label>
                      <input
                        value={createForm.email}
                        onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Phone Number
                      </label>
                      <input
                        value={createForm.phoneNumber}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, phoneNumber: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Role</label>
                      <select
                        value={createForm.role}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            role: Number(e.target.value) as ApiUserRole,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={ApiUserRole.Student}>Student</option>
                        <option value={ApiUserRole.Owner}>Owner</option>
                        <option value={ApiUserRole.Admin}>Admin</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Full Name
                      </label>
                      <input
                        value={updateForm.fullName}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, fullName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Phone Number
                      </label>
                      <input
                        value={updateForm.phoneNumber}
                        onChange={(e) =>
                          setUpdateForm((p) => ({ ...p, phoneNumber: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Role</label>
                      <select
                        value={updateForm.role}
                        onChange={(e) =>
                          setUpdateForm((p) => ({
                            ...p,
                            role: Number(e.target.value) as ApiUserRole,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={ApiUserRole.Student}>Student</option>
                        <option value={ApiUserRole.Owner}>Owner</option>
                        <option value={ApiUserRole.Admin}>Admin</option>
                      </select>
                    </div>
                    {activeUser && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Email is immutable in update DTO. Current:{' '}
                        <span className="font-semibold">{activeUser.email}</span>
                      </div>
                    )}
                  </div>
                )}
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
