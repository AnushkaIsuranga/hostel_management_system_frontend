'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export type SidebarItem = {
  label: string
  href: string
}

export default function Sidebar({ title, items }: { title?: string; items: SidebarItem[] }) {
  const pathname = usePathname()

  return (
    <aside className="surface-card sticky top-6 h-[calc(100vh-7rem)] w-full max-w-[260px] overflow-auto p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-900">{title ?? 'Menu'}</div>
        <div className="mt-1 text-xs text-gray-500">Hostel Management System</div>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
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
