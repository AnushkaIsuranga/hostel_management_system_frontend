import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-linear-to-br from-amber-50 to-white" />

      {/* Overlay (click to close) */}
      <Link
        href="/"
        aria-label="Close authentication"
        className="overlay-enter fixed inset-0 bg-black/40"
      />

      {/* Blade */}
      <aside className="drawer-enter fixed top-0 right-0 h-full w-full max-w-md bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Authentication</p>
            <p className="text-xs text-gray-500">Sign in to continue</p>
          </div>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Close
          </Link>
        </div>

        <div className="p-6">{children}</div>
      </aside>
    </div>
  )
}
