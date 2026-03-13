import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import Filters from '../../components/Filters'
import { createBaseFilters } from '../helpers/mockData'

describe('Filters component', () => {
  const baseFilters = createBaseFilters()

  it('renders heading and reset button', () => {
    const onFiltersChange = jest.fn()
    const onReset = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={onReset} />)

    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset All' })).toBeInTheDocument()
  })

  it('calls onReset when reset is clicked', () => {
    const onFiltersChange = jest.fn()
    const onReset = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={onReset} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset All' }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('updates university filter through onFiltersChange', () => {
    const onFiltersChange = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={jest.fn()} />)

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'University of Colombo' },
    })

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ university: 'University of Colombo' }),
    )
  })

  it('toggles room type option', () => {
    const onFiltersChange = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={jest.fn()} />)

    fireEvent.click(screen.getByLabelText('Single Room'))

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ roomType: ['single'] }))
  })

  it('updates city and max distance filters', () => {
    const onFiltersChange = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={jest.fn()} />)

    const selects = screen.getAllByRole('combobox')

    fireEvent.change(selects[1], { target: { value: 'Kandy' } })
    fireEvent.change(selects[2], { target: { value: '5' } })

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ city: 'Kandy' }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ maxDistance: 5 }))
  })

  it('updates price range values', () => {
    const onFiltersChange = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={jest.fn()} />)

    const priceInputs = screen.getAllByRole('spinbutton')

    fireEvent.change(priceInputs[0], { target: { value: '15000' } })
    fireEvent.change(priceInputs[1], { target: { value: '22000' } })

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ priceRange: [15000, 50000] }),
    )
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ priceRange: [0, 22000] }),
    )
  })

  it('removes a selected room type when toggled again', () => {
    const onFiltersChange = jest.fn()

    render(
      <Filters
        filters={createBaseFilters({ roomType: ['single'] })}
        onFiltersChange={onFiltersChange}
        onReset={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByLabelText('Single Room'))

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ roomType: [] }))
  })

  it('toggles gender, amenities, and other options', () => {
    const onFiltersChange = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={jest.fn()} />)

    fireEvent.click(screen.getByLabelText('Female Only'))
    fireEvent.click(screen.getByRole('button', { name: 'Amenities' }))
    fireEvent.click(screen.getByLabelText('WiFi'))
    fireEvent.click(screen.getByLabelText('Verified Hostels Only'))
    fireEvent.click(screen.getByLabelText('Available Rooms Only'))

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ gender: ['female'] }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ amenities: ['WiFi'] }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ verifiedOnly: true }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ availableOnly: true }))
  })

  it('updates minimum rating and can collapse amenity filters', () => {
    const onFiltersChange = jest.fn()

    render(<Filters filters={baseFilters} onFiltersChange={onFiltersChange} onReset={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Amenities' }))
    expect(screen.getByLabelText('WiFi')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Amenities' }))
    expect(screen.queryByLabelText('WiFi')).not.toBeInTheDocument()

    fireEvent.change(screen.getAllByRole('combobox')[3], { target: { value: '4.5' } })

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ minRating: 4.5 }))
  })
})
