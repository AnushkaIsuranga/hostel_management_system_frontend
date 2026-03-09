'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import HostelCard from '@/components/Hostelcard'
import { HostelsApi, InteractionEventsApi } from '@/lib/backendApi'
import {
  ApiInteractionType,
  type HostelReadDto,
  type InteractionEventReadDto,
} from '@/types/backend'

function getActionFromMetadata(metadata: InteractionEventReadDto['metadata']): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const action = (metadata as Record<string, unknown>).action
  return typeof action === 'string' ? action : undefined
}

export default function StudentSavedHostelsPage() {
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [savedHostels, setSavedHostels] = useState<HostelReadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!userId) {
        setError('Missing user id in route')
        setLoading(false)
        return
      }

      try {
        setError(null)
        setLoading(true)

        const [events, hostels] = await Promise.all([
          InteractionEventsApi.list(),
          HostelsApi.list(),
        ])

        const userSaveEvents = events
          .filter(
            (event) =>
              event.userId === userId &&
              event.eventType === ApiInteractionType.Save &&
              Boolean(event.hostelId),
          )
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        const saveStateByHostel = new Map<string, { saved: boolean; createdAt: string }>()
        for (const event of userSaveEvents) {
          if (!event.hostelId) continue
          const action = getActionFromMetadata(event.metadata)
          const saved = action !== 'unsave'
          saveStateByHostel.set(event.hostelId, { saved, createdAt: event.createdAt })
        }

        const sortedSavedHostelIds = [...saveStateByHostel.entries()]
          .filter(([, value]) => value.saved)
          .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime())
          .map(([hostelId]) => hostelId)

        const hostelById = new Map(hostels.map((hostel) => [hostel.id, hostel]))
        const resolvedSavedHostels = sortedSavedHostelIds
          .map((hostelId) => hostelById.get(hostelId))
          .filter((hostel): hostel is HostelReadDto => Boolean(hostel))

        setSavedHostels(resolvedSavedHostels)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load saved hostels')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const heading = useMemo(() => {
    return savedHostels.length === 1 ? '1 Saved Hostel' : `${savedHostels.length} Saved Hostels`
  }, [savedHostels.length])

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading saved hostels…</div>
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Saved Hostels</h1>
          <p className="mt-1 text-sm text-gray-600">{heading}</p>
        </div>
        <Link
          href={userId ? `/user/student/${userId}` : '/user'}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to profile
        </Link>
      </div>

      {savedHostels.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          You have not saved any hostels yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {savedHostels.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} isSaved />
          ))}
        </div>
      )}
    </div>
  )
}
