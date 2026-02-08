'use client'

import React, { useEffect, useRef, useState } from 'react'

import type { AnimatedElementProps } from '../../types'
export type { AnimatedElementProps } from '../../types'

export default function AnimatedElement({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  distance = 12,
  easing = 'ease-out',
  threshold = 0.1,
  className = '',
  startVisible = false,
  triggerOnce = true,
  fadeIn = true,
  scale = false,
  scaleFrom = 0.95,
  rotate = false,
  rotateFrom = 0,
  blur = false,
  blurAmount = 4,
}: AnimatedElementProps) {
  const [isVisible, setIsVisible] = useState<boolean>(startVisible)
  const elementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (startVisible) return

    const currentElement = elementRef.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => {
            setIsVisible(true)
          }, delay)

          if (triggerOnce && currentElement) {
            observer.unobserve(currentElement)
          }
          return () => clearTimeout(timer)
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin: '0px',
      },
    )

    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [delay, threshold, triggerOnce, startVisible])

  const getTransform = (): string => {
    const transforms: string[] = []

    if (!isVisible) {
      switch (direction) {
        case 'up':
          transforms.push(`translateY(${distance}px)`)
          break
        case 'down':
          transforms.push(`translateY(-${distance}px)`)
          break
        case 'left':
          transforms.push(`translateX(${distance}px)`)
          break
        case 'right':
          transforms.push(`translateX(-${distance}px)`)
          break
        case 'up-left':
          transforms.push(`translate(${distance}px, ${distance}px)`)
          break
        case 'up-right':
          transforms.push(`translate(-${distance}px, ${distance}px)`)
          break
        case 'down-left':
          transforms.push(`translate(${distance}px, -${distance}px)`)
          break
        case 'down-right':
          transforms.push(`translate(-${distance}px, -${distance}px)`)
          break
        default:
          transforms.push(`translateY(${distance}px)`)
      }

      if (scale) {
        transforms.push(`scale(${scaleFrom})`)
      }

      if (rotate) {
        transforms.push(`rotate(${rotateFrom}deg)`)
      }
    } else {
      transforms.push('translate(0, 0)')
      if (scale) transforms.push('scale(1)')
      if (rotate) transforms.push('rotate(0deg)')
    }

    return transforms.join(' ')
  }

  const styles: React.CSSProperties = {
    opacity: fadeIn ? (isVisible ? 1 : 0) : 1,
    transform: getTransform(),
    filter: blur && !isVisible ? `blur(${blurAmount}px)` : 'none',
    transition: `all ${duration}ms ${easing}`,
    willChange: 'transform, opacity, filter',
  }

  return (
    <div ref={elementRef} className={className} style={styles}>
      {children}
    </div>
  )
}
