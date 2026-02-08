'use client'

import React from 'react'
import AnimatedElement, { AnimatedElementProps } from './AnimatedElement'

import type { AnimatedDirection, AnimationSequenceProps } from '../../types'
export type { AnimationSequenceProps } from '../../types'
export type Direction = AnimatedDirection

export default function AnimationSequence({
  children,
  direction = 'up',
  baseDelay = 300,
  staggerDelay = 200,
  duration = 700,
  distance = 12,
  easing = 'ease-out',
  className = '',
  triggerOnce = true,
}: AnimationSequenceProps) {
  const animatedChildren = React.Children.map(children, (child, index) => {
    const delay = baseDelay + index * staggerDelay

    if (React.isValidElement<AnimatedElementProps>(child) && child.type === AnimatedElement) {
      const childProps = child.props
      return React.cloneElement(child, {
        delay: childProps.delay !== undefined ? childProps.delay : delay,
        direction: childProps.direction || direction,
        duration: childProps.duration || duration,
        distance: childProps.distance || distance,
        easing: childProps.easing || easing,
        triggerOnce,
      })
    }

    return (
      <AnimatedElement
        key={index}
        direction={direction}
        delay={delay}
        duration={duration}
        distance={distance}
        easing={easing}
        triggerOnce={triggerOnce}
      >
        {child}
      </AnimatedElement>
    )
  })

  return <div className={className}>{animatedChildren}</div>
}
