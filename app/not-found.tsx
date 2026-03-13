import React from 'react'
import Link from 'next/link'
import { FiSearch, FiHome } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-linear-to-b from-amber-50 via-stone-50 to-amber-100 p-6">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-amber-100 shadow-inner">
            <FiSearch className="h-10 w-10 text-amber-700" aria-hidden />
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-amber-900">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-amber-800">Page Not Found</h2>
          <p className="mx-auto mt-3 max-w-md text-stone-600">
            We couldn&#39;t find the page you&#39;re looking for. It may have been removed, renamed,
            or never existed.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-5 py-2.5 font-medium text-white shadow transition-colors hover:bg-amber-800 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:outline-none"
          >
            <FiHome className="h-4 w-4" /> Go to homepage
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-5 py-2.5 font-medium text-amber-800 shadow transition-colors hover:bg-amber-50 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:outline-none"
          >
            <FiSearch className="h-4 w-4" /> Browse hostels
          </Link>
        </div>
        <p className="mt-10 text-xs text-stone-500">Hostel Finder</p>
      </div>
    </div>
  )
}
