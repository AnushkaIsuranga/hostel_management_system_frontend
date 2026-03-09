'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { AuthApi } from '@/lib/backendApi'
import { setAuthSession } from '@/lib/auth'
import { ApiUserRole } from '@/types/backend'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const tokens = await AuthApi.login({ email, password, rememberMe })
      setAuthSession(tokens)

      const next =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null
      if (next && next.startsWith('/')) {
        router.replace(next)
        return
      }

      router.replace(tokens.role === ApiUserRole.Admin ? '/admin' : '/hostels')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-600">Use your email and password to sign in.</p>
      </div>

      {error && (
        <div className="surface-card border-var p-3 text-sm text-red-700">
          <p className="font-semibold">Sign in failed</p>
          <p className="text-red-700/90">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="••••••••"
            required
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="accent-btn w-full px-4 py-3 font-semibold"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="text-sm text-gray-600">
        <p>
          New here?{' '}
          <Link href="/signup" className="font-medium text-amber-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
