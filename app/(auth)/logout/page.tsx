'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AuthApi } from '@/lib/backendApi'
import { clearAuthSession } from '@/lib/auth'

export default function LogoutPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        await AuthApi.logout()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Logout failed')
      } finally {
        clearAuthSession()
        if (!cancelled) router.replace('/')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-gray-900">Signing out…</h1>
      <p className="text-sm text-gray-600">Please wait.</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
