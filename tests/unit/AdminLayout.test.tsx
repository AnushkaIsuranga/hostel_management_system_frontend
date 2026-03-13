import React from 'react'
import { render, screen } from '@testing-library/react'

import AdminLayout from '../../app/admin/layout'

jest.mock('../../components/Navigation', () => {
  return function MockNavigation() {
    return <div data-testid="admin-navigation">navigation</div>
  }
})

jest.mock('../../components/Sidebar', () => {
  return function MockSidebar({ title, items }: any) {
    return (
      <div data-testid="admin-sidebar">
        {title}:{items.length}
      </div>
    )
  }
})

describe('AdminLayout', () => {
  it('renders navigation, sidebar, and children content', () => {
    render(
      <AdminLayout>
        <div>Admin Child</div>
      </AdminLayout>,
    )

    expect(screen.getByTestId('admin-navigation')).toBeInTheDocument()
    expect(screen.getByTestId('admin-sidebar')).toHaveTextContent('Admin:4')
    expect(screen.getByText('Admin Child')).toBeInTheDocument()
  })
})

