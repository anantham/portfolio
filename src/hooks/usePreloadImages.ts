'use client'

import { useEffect } from 'react'

export function usePreloadImages(srcs: string[]) {
  useEffect(() => {
    srcs.forEach(src => {
      if (src && !src.startsWith('data:')) {
        const img = new Image()
        img.src = src
      }
    })
  }, [srcs])
}
