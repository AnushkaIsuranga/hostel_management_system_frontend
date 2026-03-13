import React from 'react'

// This file provides a per-navigation template wrapper in the App Router.
// It must default export a component. Keep it minimal to avoid layout shifts.
export default function Template({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>
}
