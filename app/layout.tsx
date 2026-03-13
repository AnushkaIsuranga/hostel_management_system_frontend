import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import '@/styles/globals.css'
import ScrollToTopOnRouteChange from '@/components/ScrollToTopOnRouteChange'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'UniHome',
    template: '%s | UniHome',
  },
  description:
    'UniHome helps students find verified university hostels with transparent monthly pricing, reviews, and direct owner contact.',
  applicationName: 'UniHome',
  keywords: [
    'UniHome',
    'student hostel Sri Lanka',
    'university accommodation',
    'verified hostels',
    'monthly hostel rent',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'UniHome',
    description:
      'Find verified hostels near major universities. Compare monthly prices, amenities, and reviews on UniHome.',
    siteName: 'UniHome',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniHome',
    description:
      'Find verified university hostels with transparent pricing, amenities, and reviews.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <ScrollToTopOnRouteChange />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  )
}
