import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    const raw =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

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
