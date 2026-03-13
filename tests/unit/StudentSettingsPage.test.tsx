import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import StudentSettingsPage from '../../app/user/student/[userId]/settings/page'
import { createAmenity, createBaseUser } from '../helpers/mockData'

const useParamsMock = jest.fn()
const replaceMock = jest.fn()
const usersGetMock = jest.fn()
const usersUpdateMock = jest.fn()
const universitiesListMock = jest.fn()
const amenitiesListMock = jest.fn()
const getMeMock = jest.fn()
const upsertMeMock = jest.fn()
const routerMock = { replace: replaceMock }

jest.mock('next/link', () => require('./helpers/nextMocks').nextLinkModule)

jest.mock('next/navigation', () =>
  require('./helpers/navigationMocks').createNextNavigationModule({
    useParams: (...args: any[]) => useParamsMock(...args),
    useRouter: () => routerMock,
  }),
)

jest.mock('../../lib/backendApi', () => ({
  UsersApi: {
    get: (...args: any[]) => usersGetMock(...args),
    update: (...args: any[]) => usersUpdateMock(...args),
  },
  UniversitiesApi: {
    list: (...args: any[]) => universitiesListMock(...args),
  },
  AmenitiesApi: {
    list: (...args: any[]) => amenitiesListMock(...args),
  },
  StudentPreferencesApi: {
    getMe: (...args: any[]) => getMeMock(...args),
    upsertMe: (...args: any[]) => upsertMeMock(...args),
  },
}))

jest.mock('../../components/auth/StudentPreferencesFields', () => {
  return function MockStudentPreferencesFields(props: any) {
    return (
      <div>
        <div data-testid="selected-university">{props.selectedUniversityId || 'none'}</div>
        <div data-testid="priority-order">{props.priorityOrder.join(',')}</div>
        <button type="button" onClick={() => props.onUniversityChange('uni-1')}>
          Choose University
        </button>
        <button type="button" onClick={() => props.onMinBudgetChange(5000)}>
          Set Min Budget
        </button>
        <button type="button" onClick={() => props.onMaxBudgetChange(12000)}>
          Set Max Budget
        </button>
        <button type="button" onClick={() => props.onRequiredCapacityChange(2)}>
          Set Capacity
        </button>
        <button type="button" onClick={() => props.onToggleAmenity('WiFi')}>
          Toggle WiFi
        </button>
        <button type="button" onClick={() => props.onDragStartPriority('rating')}>
          Start Priority Drag
        </button>
        <button type="button" onClick={() => props.onDropPriority('price')}>
          Drop On Price
        </button>
      </div>
    )
  }
})

describe('Student settings page', () => {
  beforeEach(() => {
    useParamsMock.mockReset()
    replaceMock.mockReset()
    usersGetMock.mockReset()
    usersUpdateMock.mockReset()
    universitiesListMock.mockReset()
    amenitiesListMock.mockReset()
    getMeMock.mockReset()
    upsertMeMock.mockReset()

    useParamsMock.mockReturnValue({ userId: 'student-1' })
    usersGetMock.mockResolvedValue(
      createBaseUser({
        id: 'student-1',
        fullName: 'Alice Student',
        email: 'alice@example.com',
        phoneNumber: '+94111111111',
        role: 0,
      }),
    )
    universitiesListMock.mockResolvedValue([{ id: 'uni-1', name: 'University A' }])
    amenitiesListMock.mockResolvedValue([createAmenity()])
    getMeMock.mockRejectedValue(new Error('No preference yet'))
    usersUpdateMock.mockResolvedValue({})
    upsertMeMock.mockResolvedValue({})
  })

  it('shows validation error when university is not selected', async () => {
    render(<StudentSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Student settings')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Select a university before saving preferences.')).toBeInTheDocument()
    })

    expect(usersUpdateMock).not.toHaveBeenCalled()
    expect(upsertMeMock).not.toHaveBeenCalled()
  })

  it('saves profile and preferences then redirects', async () => {
    render(<StudentSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Student settings')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Choose University' }))
    fireEvent.click(screen.getByRole('button', { name: 'Set Min Budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Set Max Budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Set Capacity' }))
    fireEvent.click(screen.getByRole('button', { name: 'Toggle WiFi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start Priority Drag' }))
    fireEvent.click(screen.getByRole('button', { name: 'Drop On Price' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(usersUpdateMock).toHaveBeenCalledWith('student-1', {
        fullName: 'Alice Student',
        phoneNumber: '+94111111111',
        role: 0,
      })
      expect(upsertMeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          universityId: 'uni-1',
          minBudget: 5000,
          maxBudget: 12000,
          requiredCapacity: 2,
          selectedAmenities: ['WiFi'],
          priorityOrder: ['rating', 'price', 'distance'],
          weights: { price: 0.3, distance: 0.2, rating: 0.5 },
        }),
      )
      expect(replaceMock).toHaveBeenCalledWith('/user/student/student-1')
    })
  })

  it('applies existing student preferences and normalizes the priority order', async () => {
    getMeMock.mockResolvedValue({
      userId: 'student-1',
      universityId: 'uni-existing',
      minBudget: 8000,
      maxBudget: 16000,
      requiredCapacity: 1,
      selectedAmenities: ['AC'],
      priorityOrder: ['rating', 'rating', 'unknown'] as any,
      weights: { price: 0.2, distance: 0.3, rating: 0.5 },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: null,
    })

    render(<StudentSettingsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('selected-university')).toHaveTextContent('uni-existing')
    })

    expect(screen.getByTestId('priority-order')).toHaveTextContent('rating,price,distance')
  })
})
