'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { HostelsApi, UsersApi } from '@/lib/backendApi'
import type { HostelReadDto, UserReadDto } from '@/types/backend'

export default function Page() {
  const [hostels, setHostels] = useState<HostelReadDto[] | null>(null)
  const [users, setUsers] = useState<UserReadDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError(null)
        const [h, u] = await Promise.all([HostelsApi.list(), UsersApi.list()])
        if (cancelled) return
        setHostels(h)
        setUsers(u)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load admin data')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    return {
      hostels: hostels?.length ?? 0,
      users: users?.length ?? 0,
    }
  }, [hostels, users])

  return (
    <div className="space-y-6">
      <header className="surface-card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Overview from the backend API.</p>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="surface-card p-6">
          <div className="text-sm text-gray-500">Total Hostels</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {hostels ? stats.hostels : '…'}
          </div>
          <Link
            href="/admin/hostels"
            className="mt-4 inline-block text-sm font-semibold text-amber-800 hover:underline"
          >
            Manage hostels
          </Link>
        </div>
        <div className="surface-card p-6">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{users ? stats.users : '…'}</div>
          <Link
            href="/admin/users"
            className="mt-4 inline-block text-sm font-semibold text-amber-800 hover:underline"
          >
            Manage users
          </Link>
        </div>
      </div>
    </div>
  )
}
