import type { Metadata } from 'next'

import { HostelsApi } from '@/lib/backendApi'
import type { HostelReadDto } from '@/types/backend'

import HostelDetailsClient from './page.client'

type HostelsPageParams = {
  hostelId?: string
}

type Awaitable<T> = T | Promise<T>

type HostelsPageProps = {
  params?: Awaitable<HostelsPageParams>
}

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL
  return raw && raw.trim() ? raw.trim().replace(/\/$/, '') : 'http://localhost:3000'
}

function toAbsoluteUrl(input: string, siteUrl: string): string {
  if (!input) return ''
  if (/^https?:\/\//i.test(input)) return input
  const normalized = input.startsWith('/') ? input : `/${input}`
  return `${siteUrl}${normalized}`
}

function formatPrice(minPrice: number, maxPrice: number): string {
  if (!Number.isFinite(minPrice) && !Number.isFinite(maxPrice)) return 'price on request'
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
    const value = Number.isFinite(minPrice) ? minPrice : maxPrice
    return `LKR ${value.toLocaleString()} / month`
  }
  if (minPrice === maxPrice) return `LKR ${minPrice.toLocaleString()} / month`
  return `LKR ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} / month`
}

function buildDescription(hostel: HostelReadDto): string {
  const priceText = formatPrice(hostel.minPrice, hostel.maxPrice)
  const verifiedText = hostel.isVerified ? 'Verified hostel.' : ''
  return `${hostel.name} in ${hostel.city}. ${priceText}. ${hostel.genderPolicy} accommodation. ${verifiedText} Explore photos, amenities, location, and student reviews on UniHome.`.replace(
    /\s+/g,
    ' ',
  )
}

async function loadHostel(hostelId?: string): Promise<HostelReadDto | null> {
  if (!hostelId) return null
  try {
    return await HostelsApi.get(hostelId)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: HostelsPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const resolvedParams = await params
  const hostelId = resolvedParams?.hostelId
  const canonicalPath = hostelId ? `/hostels/${encodeURIComponent(hostelId)}` : '/hostels'

  const hostel = await loadHostel(hostelId)
  if (!hostel) {
    return {
      title: 'Hostel Not Found',
      description: 'The requested hostel listing could not be found on UniHome.',
      alternates: {
        canonical: canonicalPath,
      },
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const title = `${hostel.name} in ${hostel.city}`
  const description = buildDescription(hostel)
  const heroImage = hostel.images?.[0] ? toAbsoluteUrl(hostel.images[0], siteUrl) : undefined
  const canonical = toAbsoluteUrl(canonicalPath, siteUrl)

  return {
    title,
    description,
    keywords: [
      hostel.name,
      hostel.city,
      'student hostel',
      'university accommodation',
      'Sri Lanka hostels',
    ],
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'UniHome',
      images: heroImage ? [{ url: heroImage, alt: hostel.name }] : undefined,
    },
    twitter: {
      card: heroImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  }
}

export default async function Page({ params }: HostelsPageProps) {
  const resolvedParams = await params
  return <HostelDetailsClient initialHostelId={resolvedParams?.hostelId} />
}
