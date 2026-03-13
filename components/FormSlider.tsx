'use client'

import { ReactNode } from 'react'

interface FormSliderProps {
  step: number
  children: ReactNode[]
}

export default function FormSlider({ step, children }: FormSliderProps) {
  const width = children.length * 100

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          width: `${width}%`,
          transform: `translateX(-${step * (100 / children.length)}%)`,
        }}
      >
        {children.map((child, i) => (
          <div key={i} className="w-full shrink-0 px-1">
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}