import React from 'react'
import { render, screen } from '@testing-library/react'

import UserLayout from '../../app/user/layout'

jest.mock('../../components/Navigation', () => {
  return function MockNavigation() {
    return <div data-testid="user-navigation">navigation</div>
  }
})

jest.mock('../../components/Sidebar', () => {
  return function MockSidebar({ title, items }: any) {
    return (
      <div data-testid="user-sidebar">
        {title}:{items.length}
      </div>
    )
  }
})

describe('UserLayout', () => {
  it('renders navigation, sidebar, and children', () => {
    render(
      <UserLayout>
        <div>User child content</div>
      </UserLayout>,
    )

    expect(screen.getByTestId('user-navigation')).toBeInTheDocument()
    expect(screen.getByTestId('user-sidebar')).toHaveTextContent('User:2')
    expect(screen.getByText('User child content')).toBeInTheDocument()
  })
})

