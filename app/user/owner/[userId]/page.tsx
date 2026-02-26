'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { HostelsApi, UsersApi } from '@/lib/backendApi'
import { ApiHostelStatus } from '@/types/backend'
import type { HostelReadDto, UserReadDto } from '@/types/backend'

export default function OwnerProfilePage() {
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [user, setUser] = useState<UserReadDto | null>(null)
  const [hostels, setHostels] = useState<HostelReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => {
    if (!user) return ''
    return user.fullName || user.email
  }, [user])

  useEffect(() => {
    async function load() {
      try {
        setError(null)
        if (!userId) return

        const [u, hs] = await Promise.all([UsersApi.get(userId), HostelsApi.list()])
        setUser(u)

        // Backend DTO currently doesn't include an ownerId, so show list as a preview.
        setHostels(hs)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load owner dashboard')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }

  if (!user) {
    return <div className="p-6 text-sm text-gray-600">Profile not found.</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
          <div className="mt-1 text-sm text-gray-600">Owner dashboard</div>
        </div>

        <Link
          href={`/user/owner/${user.id}/settings`}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Settings
        </Link>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Monitoring</div>
          <div className="mt-2 grid gap-2 text-sm text-gray-700">
            <Metric label="Hostels" value={`${hostels.length}`} />
            <Metric
              label="Active"
              value={`${hostels.filter((h) => h.status === ApiHostelStatus.Active).length}`}
            />
            <Metric
              label="Pending"
              value={`${hostels.filter((h) => h.status === ApiHostelStatus.Pending).length}`}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">Counts reflect current list response.</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Preview</div>
            <Link href="/hostels" className="text-xs font-semibold text-gray-700 hover:underline">
              Browse
            </Link>
          </div>

          {hostels.length === 0 ? (
            <div className="mt-3 text-sm text-gray-600">No hostels yet.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {hostels.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{h.name}</div>
                    <div className="truncate text-xs text-gray-600">{h.city}</div>
                  </div>
                  <Link
                    href={`/hostels/${h.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  )
}
