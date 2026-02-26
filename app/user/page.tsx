'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UsersApi } from '@/lib/backendApi'
import type { UserReadDto } from '@/types/backend'
import { ApiUserRole } from '@/types/backend'
import { getStoredRole, getStoredUserId } from '@/lib/auth'

export default function Page() {
  const router = useRouter()
  const [users, setUsers] = useState<UserReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<UserReadDto | null>(null)
  const [closing, setClosing] = useState(false)

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
    const role = getStoredRole()
    const userId = getStoredUserId()

    // Non-admin users should land on their own profile pages.
    if (role !== undefined && role !== ApiUserRole.Admin && userId) {
      router.replace(
        role === ApiUserRole.Owner ? `/user/owner/${userId}` : `/user/student/${userId}`,
      )
      return
    }

    reload()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [query, users])

  function open(user: UserReadDto) {
    setActiveUser(user)
    setDrawerOpen(true)
  }

  function close() {
    setClosing(true)
    window.setTimeout(() => {
      setDrawerOpen(false)
      setClosing(false)
    }, 220)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="surface-card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-600">
          Public read via `GET /api/users` and `GET /api/users/{'{id}'}`
        </p>
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
                <th className="px-3 py-2">Full Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2 text-right">Profile</th>
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
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="px-3 py-3 font-medium text-gray-900">
                      <button onClick={() => open(u)} className="hover:underline">
                        {u.fullName}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{u.email}</td>
                    <td className="px-3 py-3 text-gray-700">{u.phoneNumber}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={
                          u.role === ApiUserRole.Owner
                            ? `/user/owner/${u.id}`
                            : `/user/student/${u.id}`
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen && activeUser && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 ${closing ? 'overlay-exit' : 'overlay-enter'}`}
            onClick={close}
          />
          <div
            className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-xl ${closing ? 'drawer-exit' : 'drawer-enter'}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-gray-200 p-5">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    User
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{activeUser.fullName}</h2>
                </div>
                <button
                  onClick={close}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-auto p-5 text-sm">
                <div className="surface-card p-4">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-semibold text-gray-900">{activeUser.email}</div>
                </div>
                <div className="surface-card p-4">
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="font-semibold text-gray-900">{activeUser.phoneNumber}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-5">
                <Link
                  href={
                    activeUser.role === ApiUserRole.Owner
                      ? `/user/owner/${activeUser.id}`
                      : `/user/student/${activeUser.id}`
                  }
                  className="accent-btn block w-full px-5 py-2.5 text-center text-sm font-semibold"
                >
                  View Full Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
