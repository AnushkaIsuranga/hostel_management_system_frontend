import React from 'react'
import { GripVertical } from 'lucide-react'

import type { AmenityReadDto, UniversityReadDto } from '@/types/backend'

type PriorityKey = 'price' | 'distance' | 'rating'

const DEFAULT_MIN_BUDGET = 0
const DEFAULT_MAX_BUDGET = 50000
const DEFAULT_REQUIRED_CAPACITY = 1

type StudentPreferencesFieldsProps = {
  submitting: boolean
  studentStep: 1 | 2
  selectedUniversityId: string
  universities: UniversityReadDto[]
  minBudget: number | ''
  maxBudget: number | ''
  requiredCapacity: number | ''
  amenities: AmenityReadDto[]
  selectedAmenities: string[]
  maxAmenitiesSelection: number
  priorityOrder: PriorityKey[]
  priorityLabels: Record<PriorityKey, string>
  resolvedPriorityWeights: Record<PriorityKey, number>
  onUniversityChange: (value: string) => void
  onMinBudgetChange: (value: number | '') => void
  onMaxBudgetChange: (value: number | '') => void
  onRequiredCapacityChange: (value: number | '') => void
  onToggleAmenity: (amenityName: string) => void
  onDragStartPriority: (priority: PriorityKey) => void
  onDropPriority: (priority: PriorityKey) => void
  onDragEndPriority: () => void
}

export default function StudentPreferencesFields({
  submitting,
  studentStep,
  selectedUniversityId,
  universities,
  minBudget,
  maxBudget,
  requiredCapacity,
  amenities,
  selectedAmenities,
  maxAmenitiesSelection,
  priorityOrder,
  priorityLabels,
  resolvedPriorityWeights,
  onUniversityChange,
  onMinBudgetChange,
  onMaxBudgetChange,
  onRequiredCapacityChange,
  onToggleAmenity,
  onDragStartPriority,
  onDropPriority,
  onDragEndPriority,
}: StudentPreferencesFieldsProps) {
  const isDisabled = submitting || studentStep !== 2

  return (
    <fieldset disabled={isDisabled} className="space-y-6">
      <div>
        <p className="text-lg font-bold text-gray-900">Your preferences</p>
        <p className="mt-1 text-sm text-gray-600">Help us find the perfect accommodation</p>
      </div>

      <label className="block">
        <span className="mb-3 block text-base font-bold text-gray-900">University</span>
        <select
          value={selectedUniversityId}
          onChange={(e) => onUniversityChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-50"
          required
          disabled={isDisabled}
        >
          <option value="">Select university</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-3 block text-base font-bold text-gray-900">Min budget</span>
          <input
            type="number"
            value={minBudget}
            onChange={(e) => onMinBudgetChange(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={() => {
              if (minBudget === '') onMinBudgetChange(DEFAULT_MIN_BUDGET)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            placeholder="0"
            disabled={isDisabled}
          />
        </label>

        <label className="block">
          <span className="mb-3 block text-base font-bold text-gray-900">Max budget</span>
          <input
            type="number"
            value={maxBudget}
            onChange={(e) => onMaxBudgetChange(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={() => {
              if (maxBudget === '') onMaxBudgetChange(DEFAULT_MAX_BUDGET)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            placeholder="50000"
            disabled={isDisabled}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-3 block text-base font-bold text-gray-900">Room capacity needed</span>
        <input
          type="number"
          value={requiredCapacity}
          onChange={(e) =>
            onRequiredCapacityChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          onBlur={() => {
            if (requiredCapacity === '') onRequiredCapacityChange(DEFAULT_REQUIRED_CAPACITY)
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-50"
          placeholder="1"
          disabled={isDisabled}
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Amenities</span>
          <span className="text-xs font-medium text-gray-500">
            {selectedAmenities.length}/{maxAmenitiesSelection}
          </span>
        </div>
        {amenities.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            No amenities available at the moment
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
            {amenities.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity.name)
              const canAddMore = selectedAmenities.length < maxAmenitiesSelection
              const isDisabledAmenity = isDisabled || (!isSelected && !canAddMore)

              return (
                <button
                  key={amenity.id}
                  type="button"
                  disabled={isDisabledAmenity}
                  onClick={() => onToggleAmenity(amenity.name)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : isDisabledAmenity
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {amenity.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Priority order</p>
        <p className="text-xs text-gray-600">Drag to reorder (top = most important)</p>
        <div className="space-y-2">
          {priorityOrder.map((priority, index) => (
            <div
              key={priority}
              draggable={!isDisabled}
              onDragStart={() => onDragStartPriority(priority)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropPriority(priority)}
              onDragEnd={onDragEndPriority}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all ${
                !isDisabled
                  ? 'cursor-grab border-gray-300 bg-white hover:border-amber-400 hover:bg-amber-50 active:cursor-grabbing'
                  : 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="flex-1">
                <span className="font-semibold text-gray-900">
                  {index + 1}. {priorityLabels[priority]}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {(resolvedPriorityWeights[priority] * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
