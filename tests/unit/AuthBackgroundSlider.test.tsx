import React from 'react'
import { act, render } from '@testing-library/react'

import { AuthBackgroundSlider } from '../../components/AuthBackgroundSlider'
import { useFakeTimersLifecycle } from '../helpers/timerHelpers'

jest.mock('next/image', () => require('./helpers/nextMocks').nextImageModule)

describe('AuthBackgroundSlider component', () => {
  useFakeTimersLifecycle()

  it('renders all background slides', () => {
    const { container } = render(<AuthBackgroundSlider />)

    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(3)
    expect(images[0]).toHaveAttribute('src', '/images/auth/slide-1.svg')
    expect(images[1]).toHaveAttribute('src', '/images/auth/slide-2.svg')
    expect(images[2]).toHaveAttribute('src', '/images/auth/slide-3.svg')
  })

  it('starts with first slide visible and rotates after interval', () => {
    const { container } = render(<AuthBackgroundSlider />)

    let slideLayers = container.querySelectorAll('div.transition-opacity')
    expect(slideLayers[0].className).toContain('opacity-100')
    expect(slideLayers[1].className).toContain('opacity-0')

    act(() => {
      jest.advanceTimersByTime(6500)
    })

    slideLayers = container.querySelectorAll('div.transition-opacity')
    expect(slideLayers[1].className).toContain('opacity-100')
    expect(slideLayers[0].className).toContain('opacity-0')
  })
})
