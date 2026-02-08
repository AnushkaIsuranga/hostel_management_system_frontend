'use client'

import React from 'react'
import Link from 'next/link'
import { FiAlertTriangle, FiRotateCcw, FiHome } from 'react-icons/fi'

export default function AppError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-linear-to-b from-amber-50 via-stone-50 to-amber-100 p-6">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-amber-100 bg-white/70 p-8 shadow-xl backdrop-blur">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-amber-100 shadow-inner">
            <FiAlertTriangle className="h-8 w-8 text-amber-700" aria-hidden />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-amber-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-stone-600">
            An unexpected error occurred. You can try again or head back home.
          </p>

          {process.env.NODE_ENV === 'development' && error?.message ? (
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-amber-100 bg-stone-50 p-3 text-left text-sm wrap-break-word whitespace-pre-wrap text-stone-700">
              {error.message}
            </pre>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2 font-medium text-white shadow transition-colors hover:bg-amber-800 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:outline-none"
            >
              <FiRotateCcw className="h-4 w-4" /> Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 font-medium text-amber-800 shadow transition-colors hover:bg-amber-50 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:outline-none"
            >
              <FiHome className="h-4 w-4" /> Go to homepage
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-stone-500">Hostel Finder</p>
      </div>
    </div>
  )
}
