import type { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import Navigation from '@/components/Navigation'

const adminItems = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Hostels', href: '/admin/hostels' },
  { label: 'Users', href: '/admin/users' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 py-6 pt-20 md:grid-cols-[260px_1fr]">
      <Navigation />
      <Sidebar title="Admin" items={adminItems} />
      <section className="h-[calc(100vh-7rem)] min-w-0">{children}</section>
    </div>
  )
}
