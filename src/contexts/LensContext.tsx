'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { LensId } from '@/lib/content'

interface LensContextType {
  selectedLens: LensId | null
  setSelectedLens: (lens: LensId | null) => void
  hasSelectedLens: boolean
}

const LensContext = createContext<LensContextType | undefined>(undefined)

export function LensProvider({ children }: { children: ReactNode }) {
  const [selectedLens, setSelectedLensState] = useState<LensId | null>('engineer')

  // Load lens from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selected_lens')
    if (saved && ['lw-math', 'engineer', 'embodied', 'buddhist'].includes(saved)) {
      setSelectedLensState(saved as LensId)
    } else {
      setSelectedLensState('engineer')
    }
  }, [])

  // Save lens to localStorage when changed
  const setSelectedLens = (lens: LensId | null) => {
    setSelectedLensState(lens)
    if (lens) {
      localStorage.setItem('selected_lens', lens)
    } else {
      localStorage.removeItem('selected_lens')
    }
  }

  return (
    <LensContext.Provider
      value={{
        selectedLens,
        setSelectedLens,
        hasSelectedLens: selectedLens !== null
      }}
    >
      {children}
    </LensContext.Provider>
  )
}

export function useLens() {
  const context = useContext(LensContext)
  if (context === undefined) {
    throw new Error('useLens must be used within a LensProvider')
  }
  return context
}
