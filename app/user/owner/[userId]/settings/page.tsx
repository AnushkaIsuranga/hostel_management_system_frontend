'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { UsersApi } from '@/lib/backendApi'
import type { UserReadDto, UserUpdateDto } from '@/types/backend'

export default function OwnerSettingsPage() {
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [user, setUser] = useState<UserReadDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const title = useMemo(() => {
    if (!user) return 'Owner settings'
    return user.fullName || user.email
  }, [user])

  useEffect(() => {
    async function load() {
      try {
        setError(null)
        if (!userId) return

        const nextUser = await UsersApi.get(userId)
        setUser(nextUser)
        setFullName(nextUser.fullName ?? '')
        setPhoneNumber(nextUser.phoneNumber ?? '')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load owner settings')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [userId])

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSavingProfile(true)
    setError(null)
    try {
      if (!user) {
        setError('User not loaded')
        return
      }

      const payload: UserUpdateDto = {
        fullName: fullName.trim() || user.fullName,
        phoneNumber: phoneNumber.trim() || user.phoneNumber,
        role: user.role,
      }

      await UsersApi.update(userId, payload)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="mt-1 text-sm text-gray-600">Owner settings</div>
        </div>

        {userId ? (
          <Link
            href={`/user/owner/${userId}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        ) : null}
      </div>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid gap-6">
        <section className="grid max-w-xl gap-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Profile</div>

          <form onSubmit={onSaveProfile} className="grid gap-4">
            <Field label="Full name">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                placeholder="Your full name"
              />
            </Field>

            <Field label="Email address">
              <input
                value={user?.email ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
            </Field>

            <Field label="Phone">
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                placeholder="Phone number"
              />
            </Field>

            <div className="flex items-center gap-3">
              <button
                disabled={savingProfile}
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
              {userId ? (
                <Link
                  href={`/user/owner/${userId}`}
                  className="text-sm text-gray-700 hover:underline"
                >
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {children}
    </label>
  )
}
