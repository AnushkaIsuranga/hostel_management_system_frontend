import type { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import Navigation from '@/components/Navigation'

const userItems = [
  { label: 'Users', href: '/user' },
  { label: 'Hostels', href: '/hostels' },
]

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 pt-20 md:grid-cols-[260px_1fr]">
      <Navigation />
      <Sidebar title="User" items={userItems} />
      <section className="min-w-0">{children}</section>
    </div>
  )
}
