import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import AdminUsersPage from '../../app/admin/users/page'
import { ApiUserRole } from '../../types/backend'

const listMock = jest.fn()
const createMock = jest.fn()
const updateMock = jest.fn()
const removeMock = jest.fn()

jest.mock('../../lib/backendApi', () => ({
  UsersApi: {
    list: (...args: any[]) => listMock(...args),
    create: (...args: any[]) => createMock(...args),
    update: (...args: any[]) => updateMock(...args),
    remove: (...args: any[]) => removeMock(...args),
  },
}))

describe('Admin users page', () => {
  beforeEach(() => {
    listMock.mockReset()
    createMock.mockReset()
    updateMock.mockReset()
    removeMock.mockReset()

    listMock.mockResolvedValue([
      {
        id: 'u-1',
        fullName: 'Alice Student',
        email: 'alice@example.com',
        phoneNumber: '+94111111111',
        role: ApiUserRole.Student,
      },
      {
        id: 'u-2',
        fullName: 'Bob Admin',
        email: 'admin@example.com',
        phoneNumber: '+94222222222',
        role: ApiUserRole.Admin,
      },
    ])
    ;(window.confirm as any) = jest.fn(() => true)
  })

  it('loads and filters users by query', async () => {
    render(<AdminUsersPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice Student')).toBeInTheDocument()
      expect(screen.getByText('Bob Admin')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Search by name or email'), {
      target: { value: 'alice' },
    })

    expect(screen.getByText('Alice Student')).toBeInTheDocument()
    expect(screen.queryByText('Bob Admin')).not.toBeInTheDocument()
  })

  it('creates a new user from drawer form', async () => {
    createMock.mockResolvedValue({})

    const { container } = render(<AdminUsersPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice Student')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'New User' }))
    const drawer = container.querySelector('.fixed.inset-0') as HTMLElement
    const drawerInputs = drawer.querySelectorAll('input')
    const drawerSelect = drawer.querySelector('select') as HTMLSelectElement

    fireEvent.change(drawerInputs[0], { target: { value: 'Carol Owner' } })
    fireEvent.change(drawerInputs[1], { target: { value: 'carol@example.com' } })
    fireEvent.change(drawerInputs[2], { target: { value: '+94333333333' } })
    fireEvent.change(drawerSelect, { target: { value: String(ApiUserRole.Owner) } })

    fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        fullName: 'Carol Owner',
        email: 'carol@example.com',
        phoneNumber: '+94333333333',
        role: ApiUserRole.Owner,
      })
    })
  })

  it('disables delete button for admin users', async () => {
    render(<AdminUsersPage />)

    await waitFor(() => {
      expect(screen.getByText('Bob Admin')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    expect(deleteButtons[1]).toBeDisabled()
  })
})

