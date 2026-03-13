'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { getStoredUserId } from '@/lib/auth'

export type SidebarItem = {
  label: string
  href: string
}

export default function Sidebar({ title, items }: { title?: string; items: SidebarItem[] }) {
  const pathname = usePathname()

  const pathnameParts = pathname.split('/').filter(Boolean)
  const userIndex = pathnameParts.findIndex((part) => part === 'student' || part === 'owner')
  const routeUserId = userIndex >= 0 ? pathnameParts[userIndex + 1] : undefined
  const resolvedUserId = routeUserId || getStoredUserId()

  const resolveHref = (href: string): string => {
    if (!resolvedUserId) return href
    return href.replaceAll('{userId}', resolvedUserId).replaceAll('[userId]', resolvedUserId)
  }
  // Resolve all hrefs first
  const resolvedItems = items.map((item) => ({ ...item, resolvedHref: resolveHref(item.href) }))

  // Pick only one active item: the longest matching href
  const activeHref =
    resolvedItems
      .filter(
        (item) => pathname === item.resolvedHref || pathname.startsWith(`${item.resolvedHref}/`),
      )
      .sort((a, b) => b.resolvedHref.length - a.resolvedHref.length)[0]?.resolvedHref ?? null

  return (
    <aside className="surface-card sticky top-6 h-[calc(100vh-7rem)] w-full max-w-[260px] overflow-auto p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-900">{title ?? 'Menu'}</div>
        <div className="mt-1 text-xs text-gray-500">Hostel Management System</div>
      </div>

      <nav className="space-y-1">
        {resolvedItems.map((item) => {
          const href = item.resolvedHref
          const isActive = href === activeHref
          return (
            <Link
              key={item.href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-amber-50 font-semibold text-amber-800'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-amber-800'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
