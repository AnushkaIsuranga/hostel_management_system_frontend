import React from 'react'
import { render, screen } from '@testing-library/react'

import MarketingLayout from '../../app/(marketing)/layout'

jest.mock('../../components/Navigation', () => {
  return function MockNavigation({ currentUser }: any) {
    return <div data-testid="marketing-navigation">user:{String(!!currentUser)}</div>
  }
})

describe('Marketing layout', () => {
  it('renders navigation and wraps child content in main area', () => {
    render(
      <MarketingLayout>
        <div>Marketing Child Content</div>
      </MarketingLayout>,
    )

    expect(screen.getByTestId('marketing-navigation')).toHaveTextContent('user:false')
    expect(screen.getByText('Marketing Child Content')).toBeInTheDocument()
  })
})

