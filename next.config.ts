import type { NextConfig } from 'next'

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL?.trim()
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

    const raw =
      (backendUrl && isAbsoluteUrl(backendUrl) ? backendUrl : undefined) ||
      (publicApiUrl && isAbsoluteUrl(publicApiUrl) ? publicApiUrl : undefined) ||
      'http://localhost:5134'

    // Normalize to origin (strip trailing / and optional /api)
    const withoutTrailingSlash = raw.replace(/\/+$/, '')
    const origin = withoutTrailingSlash.replace(/\/api$/i, '')

    return [
      {
        source: '/api/:path*',
        destination: `${origin}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${origin}/uploads/:path*`,
      },
    ]
  },
}

export default nextConfig
