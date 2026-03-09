'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UsersApi } from '@/lib/backendApi'
import type { UserReadDto } from '@/types/backend'

export default function StudentProfilePage() {
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [user, setUser] = useState<UserReadDto | null>(null)
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
        const res = await UsersApi.get(userId)
        setUser(res)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile')
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
          <div className="mt-1 text-sm text-gray-600">Student profile</div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/user/student/${user.id}/hostels`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Saved hostels
          </Link>
          <Link
            href={`/user/student/${user.id}/settings`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <Row label="Full name" value={user.fullName || '—'} />
        <Row label="Email" value={user.email || '—'} />
        <Row label="Phone" value={user.phoneNumber || '—'} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  )
}
