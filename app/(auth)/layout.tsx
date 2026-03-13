import type { ReactNode } from 'react'
import { AuthBackgroundSlider } from '@/components/AuthBackgroundSlider'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left side visual */}
      <div className="relative hidden lg:block">
        <AuthBackgroundSlider />
      </div>

      {/* Right side form */}
      <div className="z-20 flex h-full w-full flex-col items-center justify-center bg-white p-6 shadow-2xl lg:h-auto">
        <main className="w-full max-w-xl">{children}</main>
      </div>
    </div>
  )
}
