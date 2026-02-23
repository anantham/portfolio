'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type OrientationCategory = 'being' | 'doing' | 'becoming'

interface OrientationContextType {
  activeCategory: OrientationCategory | null
  setActiveCategory: (category: OrientationCategory | null) => void
}

const OrientationContext = createContext<OrientationContextType | undefined>(undefined)

export function OrientationProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<OrientationCategory | null>(null)

  return (
    <OrientationContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </OrientationContext.Provider>
  )
}

export function useOrientation() {
  const context = useContext(OrientationContext)
  if (!context) {
    throw new Error('useOrientation must be used within an OrientationProvider')
  }
  return context
}
