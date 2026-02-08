'use client'

import Navigation from '@/components/Navigation'
import { useState } from 'react'
import type { User } from '@/types'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [user] = useState<User | null>(null)

  return (
    <>
      <Navigation currentUser={user} />
      <main className="pt-20">{children}</main>
    </>
  )
}
