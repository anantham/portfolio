'use client'

import { useCallback, useState } from 'react'

export interface MandalaState {
  activePanel: number | null
  visitedPanels: Set<number>
  vimuttiRevealed: boolean
  activeConnection: number | null
  activatePanel: (index: number) => void
  deactivatePanel: () => void
  activateConnection: (index: number) => void
  deactivateConnection: () => void
}

const TOTAL_PANELS = 8

export function useMandalaState(): MandalaState {
  const [activePanel, setActivePanel] = useState<number | null>(null)
  const [visitedPanels, setVisitedPanels] = useState<Set<number>>(new Set())
  const [vimuttiRevealed, setVimuttiRevealed] = useState(false)
  const [activeConnection, setActiveConnection] = useState<number | null>(null)

  const activatePanel = useCallback((index: number) => {
    setActivePanel(index)
    setVisitedPanels((prev) => {
      const next = new Set(prev)
      next.add(index)
      if (next.size >= TOTAL_PANELS) {
        setVimuttiRevealed(true)
      }
      return next
    })
  }, [])

  const deactivatePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  const activateConnection = useCallback((index: number) => {
    setActiveConnection(index)
  }, [])

  const deactivateConnection = useCallback(() => {
    setActiveConnection(null)
  }, [])

  return {
    activePanel,
    visitedPanels,
    vimuttiRevealed,
    activeConnection,
    activatePanel,
    deactivatePanel,
    activateConnection,
    deactivateConnection,
  }
}
