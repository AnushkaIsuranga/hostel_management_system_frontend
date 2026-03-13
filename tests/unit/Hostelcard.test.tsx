import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import HostelCard from '../../components/Hostelcard'
import { createBaseHostel } from '../helpers/mockData'

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)
jest.mock('next/image', () => require('./helpers/nextMocks').nextImageModule)

describe('HostelCard component', () => {
  const baseHostel = createBaseHostel()

  it('renders core hostel information', () => {
    render(<HostelCard hostel={baseHostel} />)

    expect(screen.getByRole('heading', { name: 'Sunrise Hostel' })).toBeInTheDocument()
    expect(screen.getByText('12 Main Street, Colombo')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('calls onView when the card link is clicked', () => {
    const onView = jest.fn()

    render(<HostelCard hostel={baseHostel} onView={onView} />)

    fireEvent.click(screen.getByRole('link'))

    expect(onView).toHaveBeenCalledWith(baseHostel.id)
  })

  it('calls onSave and prevents onView when save button is clicked', () => {
    const onSave = jest.fn()
    const onView = jest.fn()

    render(<HostelCard hostel={baseHostel} onSave={onSave} onView={onView} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onSave).toHaveBeenCalledWith(baseHostel.id)
    expect(onView).not.toHaveBeenCalled()
  })
})
