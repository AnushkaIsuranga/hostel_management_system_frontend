import React from 'react'
import { render, screen } from '@testing-library/react'

import MarketingLandingPage from '../../app/(marketing)/page'

jest.mock('../../lib/animations/AnimatedElement', () => {
  return function MockAnimatedElement({ children }: any) {
    return <>{children}</>
  }
})

jest.mock('../../lib/animations/ParallaxElement', () => ({
  ParallaxElement: ({ children }: any) => <>{children}</>,
}))

describe('Marketing landing page', () => {
  it('renders key hero and section headings', () => {
    render(<MarketingLandingPage />)

    expect(screen.getByText('Find Your Perfect')).toBeInTheDocument()
    expect(screen.getByText('Student Hostel')).toBeInTheDocument()
    expect(screen.getByText('Why Students Choose UniHome')).toBeInTheDocument()
    expect(screen.getByText('Covering Major Universities')).toBeInTheDocument()
    expect(screen.getByText('Student Success Stories')).toBeInTheDocument()
  })

  it('renders primary call-to-action buttons', () => {
    render(<MarketingLandingPage />)

    expect(screen.getByRole('button', { name: 'Browse Hostels' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List Your Hostel' })).toBeInTheDocument()
  })
})

