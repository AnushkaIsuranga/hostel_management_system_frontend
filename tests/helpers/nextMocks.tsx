import React from 'react'

type LinkLikeProps = {
  children: React.ReactNode
  href: string
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export function MockNextLink({ children, href, ...props }: LinkLikeProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

type ImageLikeProps = {
  src: string
  alt: string
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
} & React.ImgHTMLAttributes<HTMLImageElement>

export function MockNextImage({ src, alt, fill, priority, unoptimized, ...props }: ImageLikeProps) {
  return (
    <img
      src={src || 'about:blank'}
      alt={alt}
      data-fill={String(!!fill)}
      data-priority={String(!!priority)}
      data-unoptimized={String(!!unoptimized)}
      {...props}
    />
  )
}

export const nextLinkModule = {
  __esModule: true,
  default: MockNextLink,
}

export const nextImageModule = {
  __esModule: true,
  default: MockNextImage,
}

