'use client'

import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'

type Slide = {
  src: string
  alt: string
}

export function AuthBackgroundSlider() {
  const slides = useMemo<Slide[]>(
    () => [
      { src: '/images/auth/slide-1.svg', alt: '' },
      { src: '/images/auth/slide-2.svg', alt: '' },
      { src: '/images/auth/slide-3.svg', alt: '' },
    ],
    [],
  )

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 6500)

    return () => window.clearInterval(id)
  }, [slides.length])

  return (
    <div aria-hidden className="fixed inset-0">
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-white/40" />
    </div>
  )
}
