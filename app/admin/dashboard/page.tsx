'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import {
  AmenitiesApi,
  HostelsApi,
  InteractionEventsApi,
  UniversitiesApi,
  UsersApi,
} from '@/lib/backendApi'
import {
  ApiHostelVerificationStatus,
  ApiInteractionType,
  type HostelReadDto,
  type InteractionEventReadDto,
  type UserReadDto,
} from '@/types/backend'
import {
  FaBell,
  FaBuilding,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaMapMarkedAlt,
  FaTag,
  FaUniversity,
  FaUsers,
} from 'react-icons/fa'

const VERIFICATION_STATUS: Record<
  number,
  { label: string; color: string; bg: string; dot: string }
> = {
  0: { label: 'None', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' },
  1: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  2: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  3: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  4: { label: 'Expired', color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
}

type VerificationQueueItem = {
  hostelId: string
  hostelName: string
  waitDays: number
}

function daysBetween(fromIso: string, nowMs: number): number {
  const fromMs = new Date(fromIso).getTime()
  if (Number.isNaN(fromMs)) return 0
  return Math.max(0, Math.floor((nowMs - fromMs) / (1000 * 60 * 60 * 24)))
}

function isWithinDays(iso: string | null | undefined, days: number, nowMs: number): boolean {
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return false
  return nowMs - ts <= days * 24 * 60 * 60 * 1000
}

function StatusBadge({ status }: { status: number }) {
  const s = VERIFICATION_STATUS[status] ?? VERIFICATION_STATUS[0]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  accent: string
  href?: string
}) {
  const inner = (
    <div className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`absolute top-0 right-0 h-20 w-20 translate-x-4 -translate-y-4 rounded-full opacity-10 ${accent}`}
      />
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${accent} text-white`}
      >
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-500">{label}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
      {href && (
        <div className="mt-3 text-xs font-semibold text-amber-800 opacity-0 transition-opacity group-hover:opacity-100">
          View all -&gt;
        </div>
      )}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function MiniBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 truncate text-xs text-gray-500">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-16 text-right text-xs font-semibold text-gray-700 tabular-nums">
        {count} <span className="font-normal text-gray-400">({pct}%)</span>
      </div>
    </div>
  )
}

export default function Page() {
  const [hostels, setHostels] = useState<HostelReadDto[] | null>(null)
  const [users, setUsers] = useState<UserReadDto[] | null>(null)
  const [events, setEvents] = useState<InteractionEventReadDto[] | null>(null)
  const [amenityCount, setAmenityCount] = useState<number | null>(null)
  const [uniCount, setUniCount] = useState<number | null>(null)
  const [reviewCountsByHostel, setReviewCountsByHostel] = useState<Record<string, number>>({})
  const [reviewsThisWeek, setReviewsThisWeek] = useState(0)
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItem[]>([])
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError(null)
        const [h, u, a, un, ev] = await Promise.allSettled([
          HostelsApi.list(),
          UsersApi.list(),
          AmenitiesApi.list(),
          UniversitiesApi.list(),
          InteractionEventsApi.list(),
        ])

        if (cancelled) return

        const hostelList = h.status === 'fulfilled' ? h.value : []
        setHostels(h.status === 'fulfilled' ? h.value : null)
        setUsers(u.status === 'fulfilled' ? u.value : null)
        setEvents(ev.status === 'fulfilled' ? ev.value : null)
        setAmenityCount(a.status === 'fulfilled' ? a.value.length : null)
        setUniCount(un.status === 'fulfilled' ? un.value.length : null)

        if (hostelList.length > 0) {
          const reviewResults = await Promise.allSettled(
            hostelList.map((hostel) => HostelsApi.reviews.list(hostel.id)),
          )

          if (cancelled) return

          const now = Date.now()
          const countMap: Record<string, number> = {}
          let weekCount = 0

          reviewResults.forEach((result, index) => {
            const hostel = hostelList[index]
            if (result.status !== 'fulfilled') {
              countMap[hostel.id] = 0
              return
            }
            countMap[hostel.id] = result.value.length
            weekCount += result.value.filter((r) => isWithinDays(r.createdAt, 7, now)).length
          })

          setReviewCountsByHostel(countMap)
          setReviewsThisWeek(weekCount)

          const pendingHostels = hostelList.filter(
            (hostel) => hostel.verificationStatus === ApiHostelVerificationStatus.Pending,
          )
          const verificationResults = await Promise.allSettled(
            pendingHostels.map((hostel) => HostelsApi.verification.listRequests(hostel.id)),
          )

          if (cancelled) return

          const queueItems: VerificationQueueItem[] = verificationResults
            .map((result, index) => {
              const hostel = pendingHostels[index]
              const nowMs = Date.now()

              if (result.status !== 'fulfilled') {
                return {
                  hostelId: hostel.id,
                  hostelName: hostel.name,
                  waitDays: daysBetween(hostel.createdAt, nowMs),
                }
              }

              const pendingRequests = result.value
                .filter((req) => req.status === ApiHostelVerificationStatus.Pending)
                .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))

              const startedAt = pendingRequests[0]?.createdAt ?? hostel.createdAt
              return {
                hostelId: hostel.id,
                hostelName: hostel.name,
                waitDays: daysBetween(startedAt, nowMs),
              }
            })
            .sort((a, b) => b.waitDays - a.waitDays)

          setVerificationQueue(queueItems)

          const subscriptionResults = await Promise.allSettled(
            hostelList.map((hostel) => HostelsApi.subscription.get(hostel.id)),
          )

          if (cancelled) return

          const active = subscriptionResults.filter(
            (result) => result.status === 'fulfilled' && result.value.isActive,
          ).length
          setActiveSubscriptionCount(active)
        }

        if (h.status === 'rejected' && u.status === 'rejected') {
          setError('Failed to load dashboard data')
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load admin data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const userById = useMemo(() => {
    const map = new Map<string, UserReadDto>()
    for (const user of users ?? []) {
      map.set(user.id, user)
    }
    return map
  }, [users])

  const stats = useMemo(() => {
    if (!hostels) return null

    const now = Date.now()
    const total = hostels.length
    const verified = hostels.filter((h) => h.isVerified).length
    const pending = hostels.filter(
      (h) => h.verificationStatus === ApiHostelVerificationStatus.Pending,
    ).length
    const rejected = hostels.filter(
      (h) => h.verificationStatus === ApiHostelVerificationStatus.Rejected,
    ).length
    const expired = hostels.filter(
      (h) => h.verificationStatus === ApiHostelVerificationStatus.Expired,
    ).length
    const none = hostels.filter(
      (h) => h.verificationStatus === ApiHostelVerificationStatus.None,
    ).length

    const hostelsThisWeek = hostels.filter((h) => isWithinDays(h.createdAt, 7, now)).length
    const hostelsPrevWeek = hostels.filter((h) => {
      const created = new Date(h.createdAt).getTime()
      if (Number.isNaN(created)) return false
      const daysDiff = (now - created) / (1000 * 60 * 60 * 24)
      return daysDiff > 7 && daysDiff <= 14
    }).length
    const hostelWeekDelta = hostelsThisWeek - hostelsPrevWeek

    const usersThisWeek = (users ?? []).filter((u) => isWithinDays(u.createdAt, 7, now)).length
    const usersThisMonth = (users ?? []).filter((u) => isWithinDays(u.createdAt, 30, now)).length

    const cityMap: Record<string, number> = {}
    for (const h of hostels) {
      const city = h.city?.trim() || 'Unknown'
      cityMap[city] = (cityMap[city] ?? 0) + 1
    }
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const policyMap: Record<string, number> = {}
    for (const h of hostels) {
      const policy = h.genderPolicy || 'Unspecified'
      policyMap[policy] = (policyMap[policy] ?? 0) + 1
    }

    const quality = {
      noImages: hostels.filter((h) => (h.images?.length ?? 0) === 0).length,
      noDescription: hostels.filter((h) => !h.description?.trim()).length,
      noReviews: hostels.filter((h) => (reviewCountsByHostel[h.id] ?? 0) === 0).length,
    }

    const monthLabels: string[] = []
    const monthMap = new Map<string, number>()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthLabels.push(key)
      monthMap.set(key, 0)
    }
    for (const h of hostels) {
      const d = new Date(h.createdAt)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
    }
    const growthSeries = monthLabels.map((key) => {
      const [year, month] = key.split('-')
      return {
        key,
        label: new Date(Number(year), Number(month) - 1, 1).toLocaleString(undefined, {
          month: 'short',
        }),
        count: monthMap.get(key) ?? 0,
      }
    })

    return {
      total,
      verified,
      pending,
      rejected,
      expired,
      none,
      hostelsThisWeek,
      usersThisWeek,
      usersThisMonth,
      hostelWeekDelta,
      topCities,
      policyMap,
      quality,
      growthSeries,
      recentHostels: [...hostels].slice(0, 6),
    }
  }, [hostels, users, reviewCountsByHostel])

  const queueHealth = useMemo(() => {
    if (verificationQueue.length === 0) {
      return {
        avgWait: 0,
        oldest: 0,
        over3Days: 0,
        over7Days: 0,
      }
    }

    const totalWait = verificationQueue.reduce((sum, item) => sum + item.waitDays, 0)
    return {
      avgWait: Number((totalWait / verificationQueue.length).toFixed(1)),
      oldest: Math.max(...verificationQueue.map((item) => item.waitDays)),
      over3Days: verificationQueue.filter((item) => item.waitDays > 3).length,
      over7Days: verificationQueue.filter((item) => item.waitDays > 7).length,
    }
  }, [verificationQueue])

  const activity = useMemo(() => {
    const now = Date.now()
    const last24h = (events ?? []).filter((event) => isWithinDays(event.createdAt, 1, now))

    const isAction = (event: InteractionEventReadDto, name: string) => {
      const action = event.metadata?.action
      return typeof action === 'string' && action === name
    }

    const views = last24h.filter((e) => e.eventType === ApiInteractionType.ViewHostel).length
    const mapClicks = last24h.filter((e) => isAction(e, 'map_click')).length
    const calls = last24h.filter((e) => isAction(e, 'call_owner')).length
    const reviewsPosted = last24h.filter((e) => isAction(e, 'review_submit')).length

    const viewsByHostel = new Map<string, number>()
    for (const event of events ?? []) {
      if (event.eventType !== ApiInteractionType.ViewHostel || !event.hostelId) continue
      viewsByHostel.set(event.hostelId, (viewsByHostel.get(event.hostelId) ?? 0) + 1)
    }

    const topViewed = [...viewsByHostel.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hostelId, count]) => ({
        hostelId,
        count,
        hostelName: hostels?.find((h) => h.id === hostelId)?.name ?? 'Unknown hostel',
      }))

    const recentEvents = [...(events ?? [])]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8)

    return {
      views,
      mapClicks,
      calls,
      reviewsPosted,
      topViewed,
      recentEvents,
    }
  }, [events, hostels])

  const alerts = useMemo(() => {
    const items: string[] = []
    if (!stats) return items

    if (queueHealth.over3Days > 0) {
      items.push(`${queueHealth.over3Days} hostels pending verification for more than 3 days`)
    }
    if (queueHealth.over7Days > 0) {
      items.push(`${queueHealth.over7Days} hostels pending verification for more than 7 days`)
    }
    if (stats.quality.noImages > 0) {
      items.push(`${stats.quality.noImages} listings have no images`)
    }
    if (stats.quality.noDescription > 0) {
      items.push(`${stats.quality.noDescription} listings are missing descriptions`)
    }
    if (stats.quality.noReviews > 0) {
      items.push(`${stats.quality.noReviews} listings have no reviews yet`)
    }

    return items
  }, [queueHealth, stats])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 rounded-2xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-amber-800 px-7 py-6 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute right-20 -bottom-4 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-widest text-amber-300 uppercase">
            Hostel Management System
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-amber-200">
            {stats
              ? `${stats.total} hostels · ${users?.length ?? 0} users · ${stats.pending} pending verification`
              : 'Loading overview...'}
          </p>
        </div>
        {error && (
          <p className="relative mt-3 rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Hostels (7 days)"
          value={stats?.hostelsThisWeek ?? 0}
          sub={`Delta ${stats?.hostelWeekDelta && stats.hostelWeekDelta > 0 ? '+' : ''}${stats?.hostelWeekDelta ?? 0}`}
          icon={<FaBuilding className="h-5 w-5" />}
          accent="bg-amber-700"
          href="/admin/hostels"
        />
        <StatCard
          label="Users (7 days)"
          value={stats?.usersThisWeek ?? 0}
          sub={`${stats?.usersThisMonth ?? 0} in 30 days`}
          icon={<FaUsers className="h-5 w-5" />}
          accent="bg-stone-600"
          href="/admin/users"
        />
        <StatCard
          label="Reviews (7 days)"
          value={reviewsThisWeek}
          sub="New review velocity"
          icon={<FaChartLine className="h-5 w-5" />}
          accent="bg-indigo-700"
        />
        <StatCard
          label="Pending Queue"
          value={stats?.pending ?? 0}
          sub={`Avg wait ${queueHealth.avgWait} days`}
          icon={<FaClock className="h-5 w-5" />}
          accent={stats?.pending ? 'bg-amber-500' : 'bg-gray-400'}
          href="/admin/hostels"
        />
        <StatCard
          label="Amenities"
          value={amenityCount ?? 0}
          icon={<FaTag className="h-5 w-5" />}
          accent="bg-teal-700"
        />
        <StatCard
          label="Universities"
          value={uniCount ?? 0}
          icon={<FaUniversity className="h-5 w-5" />}
          accent="bg-emerald-700"
          href="/admin/universities"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
            <FaCheckCircle className="h-3.5 w-3.5" /> Verification Pipeline
          </h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-semibold">Pending: {stats?.pending ?? 0}</p>
            <p>Average wait: {queueHealth.avgWait} days</p>
            <p>Oldest pending: {queueHealth.oldest} days</p>
            <p>Over 3 days: {queueHealth.over3Days}</p>
            <p>Over 7 days: {queueHealth.over7Days}</p>
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {verificationQueue.slice(0, 4).map((item) => (
              <div
                key={item.hostelId}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{item.hostelName}</div>
                  <div className="text-xs text-gray-500">Waiting {item.waitDays} day(s)</div>
                </div>
                <Link
                  href="/admin/hostels"
                  className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
            <FaChartLine className="h-3.5 w-3.5" /> Growth (6 months)
          </h2>
          <div className="space-y-3">
            {stats?.growthSeries.map((point) => (
              <MiniBar
                key={point.key}
                label={point.label}
                count={point.count}
                total={Math.max(...stats.growthSeries.map((p) => p.count), 1)}
                color="bg-amber-500"
              />
            ))}
          </div>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
              Listings Funnel
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Created</span>
                <span className="font-semibold">{stats?.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Verified</span>
                <span className="font-semibold">{stats?.verified ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subscribed (active)</span>
                <span className="font-semibold">{activeSubscriptionCount ?? 0}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
            <FaBell className="h-3.5 w-3.5" /> Alerts and Quality
          </h2>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                No urgent operational alerts.
              </p>
            ) : (
              alerts.map((item) => (
                <p key={item} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {item}
                </p>
              ))
            )}
          </div>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
              Listing Quality
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>No images</span>
                <span className="font-semibold">{stats?.quality.noImages ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>No description</span>
                <span className="font-semibold">{stats?.quality.noDescription ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>No reviews</span>
                <span className="font-semibold">{stats?.quality.noReviews ?? 0}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
            <FaMapMarkedAlt className="h-3.5 w-3.5" /> User Activity (24h)
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-gray-500">Hostel views</p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">{activity.views}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-gray-500">Map clicks</p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">{activity.mapClicks}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-gray-500">Owner calls</p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">{activity.calls}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-gray-500">Reviews posted</p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">{activity.reviewsPosted}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
              Top Viewed Hostels
            </h3>
            <div className="space-y-2">
              {activity.topViewed.length === 0 ? (
                <p className="text-sm text-gray-500">No interaction data yet.</p>
              ) : (
                activity.topViewed.map((item) => (
                  <div key={item.hostelId} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-3 text-gray-700">{item.hostelName}</span>
                    <span className="font-semibold text-gray-900">{item.count} views</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold tracking-wide text-gray-400 uppercase">
            Recent System Events
          </h2>
          <div className="space-y-2">
            {activity.recentEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No recent events.</p>
            ) : (
              activity.recentEvents
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((event) => {
                  const hostel = hostels?.find((h) => h.id === event.hostelId)
                  const action = event.metadata?.action
                  const actionLabel =
                    typeof action === 'string'
                      ? action.replace(/_/g, ' ')
                      : event.eventType === ApiInteractionType.ViewHostel
                        ? 'hostel view'
                        : 'interaction'
                  return (
                    <div key={event.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <p className="font-medium text-gray-800">
                        {actionLabel} {hostel ? `- ${hostel.name}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )
                })
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-bold text-gray-900">Operational Snapshot</h2>
          <Link
            href="/admin/hostels"
            className="text-xs font-semibold text-amber-800 hover:underline"
          >
            View all hostels
          </Link>
        </div>
        {!stats ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : stats.recentHostels.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">No hostels found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  <th className="px-5 py-3">Hostel</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Verification</th>
                  <th className="px-5 py-3">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentHostels.map((h) => {
                  const owner = userById.get(h.ownerId)
                  return (
                    <tr key={h.id} className="transition-colors hover:bg-amber-50/40">
                      <td className="max-w-[220px] truncate px-5 py-3 font-semibold text-gray-900">
                        {h.name}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{h.city || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="leading-tight font-medium text-gray-800">
                          {owner?.fullName || '-'}
                        </div>
                        {owner?.email && <div className="text-xs text-gray-400">{owner.email}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={h.verificationStatus ?? 0} />
                      </td>
                      <td className="px-5 py-3 text-gray-600">{reviewCountsByHostel[h.id] ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
