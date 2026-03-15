import type { NextConfig } from 'next'

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

type RemotePattern = {
  protocol: 'http' | 'https'
  hostname: string
  pathname: string
}

function toRemotePattern(raw?: string): RemotePattern | null {
  if (!raw || !isAbsoluteUrl(raw)) return null

  try {
    const parsed = new URL(raw)
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      pathname: '/**',
    }
  } catch {
    return null
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'hostelstagingbucket.s3.amazonaws.com', pathname: '/**' },
      toRemotePattern(process.env.BACKEND_URL),
      toRemotePattern(process.env.NEXT_PUBLIC_ASSET_BASE_URL),
      toRemotePattern(process.env.NEXT_PUBLIC_STORAGE_BASE_URL),
      toRemotePattern(process.env.NEXT_PUBLIC_S3_BASE_URL),
    ].filter((pattern): pattern is RemotePattern => pattern !== null),
  },
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
