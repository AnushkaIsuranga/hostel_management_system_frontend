import React from 'react'

import AdminPage from '../../app/admin/page'

const redirectMock = jest.fn()

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    redirect: (...args: any[]) => redirectMock(...args),
  }),
)

describe('Admin root page redirect', () => {
  it('redirects to admin dashboard', () => {
    AdminPage()

    expect(redirectMock).toHaveBeenCalledWith('/admin/dashboard')
  })
})

