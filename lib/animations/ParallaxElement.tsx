'use client'

import React, { useEffect, useRef, useState } from 'react'

import type { ParallaxElementProps, ParallaxLayerProps, ParallaxDirection } from '../../types'
export type { ParallaxElementProps, ParallaxLayerProps } from '../../types'

export const ParallaxElement = ({
  children,
  speed = 0.5,
  direction = 'vertical',
  scale = false,
  scaleRange = [1, 1.2],
  rotate = false,
  rotateRange = [0, 360],
  opacity = false,
  opacityRange = [0.3, 1],
  blur = false,
  blurRange = [0, 10],
  threshold = 0,
  rootMargin = '0px',
  className = '',
  disabled = false,
  easing = 'linear',
}: ParallaxElementProps) => {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (disabled) return

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      {
        threshold,
        rootMargin,
      },
    )

    observer.observe(element)

    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const el = elementRef.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        const elementTop = rect.top
        const elementHeight = rect.height
        const windowHeight = window.innerHeight

        const progress = Math.max(
          0,
          Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight)),
        )

        setScrollProgress(progress)
      })
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      observer.disconnect()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [disabled, threshold, rootMargin])

  const applyEasing = (progress: number): number => {
    switch (easing) {
      case 'ease-in':
        return progress * progress
      case 'ease-out':
        return progress * (2 - progress)
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
      default:
        return progress
    }
  }

  const easedProgress = applyEasing(scrollProgress)

  const getTransform = (): React.CSSProperties => {
    if (disabled || !isInView) return {}

    const transforms: string[] = []
    const movement = (easedProgress - 0.5) * 200 * speed

    if ((direction as ParallaxDirection) === 'vertical') {
      transforms.push(`translateY(${movement}px)`)
    } else if ((direction as ParallaxDirection) === 'horizontal') {
      transforms.push(`translateX(${movement}px)`)
    } else if (direction === 'diagonal') {
      transforms.push(`translate(${movement}px, ${movement}px)`)
    }

    if (scale) {
      const [minScale, maxScale] = scaleRange
      const scaleValue = minScale + (maxScale - minScale) * easedProgress
      transforms.push(`scale(${scaleValue})`)
    }

    if (rotate) {
      const [startRotate, endRotate] = rotateRange
      const rotateValue = startRotate + (endRotate - startRotate) * easedProgress
      transforms.push(`rotate(${rotateValue}deg)`)
    }

    return { transform: transforms.join(' ') }
  }

  const getOpacity = (): number => {
    if (!opacity || disabled || !isInView) return 1
    const [minOpacity, maxOpacity] = opacityRange
    return minOpacity + (maxOpacity - minOpacity) * easedProgress
  }

  const getBlur = (): number => {
    if (!blur || disabled || !isInView) return 0
    const [minBlur, maxBlur] = blurRange
    return minBlur + (maxBlur - minBlur) * (1 - easedProgress)
  }

  const blurValue = getBlur()

  const styles: React.CSSProperties = {
    ...getTransform(),
    opacity: getOpacity(),
    filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
    willChange: 'transform, opacity, filter',
  }

  return (
    <div ref={elementRef} className={className} style={styles}>
      {children}
    </div>
  )
}

export const ParallaxLayer = ({ children, depth = 0, className = '' }: ParallaxLayerProps) => {
  const speed = 1 - depth * 0.2

  return (
    <ParallaxElement speed={speed} className={className}>
      {children}
    </ParallaxElement>
  )
}
