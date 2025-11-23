/**
 * Atmosphere Context
 *
 * Provides circadian state, memory state, and behavior tracking
 * to all components. Makes time and familiarity first-class properties.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getCurrentCircadianState,
  getCircadianTheme,
  type CircadianState,
  type CircadianTheme
} from '@/lib/circadian'
import {
  getMemoryState,
  recordVisit,
  markNodeSeen,
  recordInteraction,
  getNoveltyScore,
  getFamiliarityLevel,
  trackScroll,
  trackHover,
  trackInteraction,
  getBehaviorState,
  shouldShowAdvancedFeatures,
  getUIComplexity,
  type MemoryState,
  type BehaviorState
} from '@/lib/memory'

interface AtmosphereContextValue {
  // Circadian
  circadian: CircadianState
  theme: CircadianTheme

  // Memory
  memory: MemoryState
  familiarityLevel: 'newcomer' | 'returning' | 'familiar' | 'intimate'

  // Behavior
  behavior: BehaviorState
  uiComplexity: 'minimal' | 'standard' | 'rich' | 'maximal'
  showAdvanced: boolean

  // Actions
  markSeen: (nodeId: string) => void
  recordNodeInteraction: (nodeId: string) => void
  getNovelty: (nodeId: string) => number
  onScroll: () => void
  onHover: (duration: number) => void
  onInteract: () => void
}

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null)

export function AtmosphereProvider({ children }: { children: React.ReactNode }) {
  // Circadian state
  const [circadian, setCircadian] = useState<CircadianState>(() => getCurrentCircadianState())
  const [theme, setTheme] = useState<CircadianTheme>(() => getCircadianTheme(circadian))

  // Memory state
  const [memory, setMemory] = useState<MemoryState>(() => getMemoryState())
  const [familiarityLevel, setFamiliarityLevel] = useState<'newcomer' | 'returning' | 'familiar' | 'intimate'>(() =>
    getFamiliarityLevel(memory.visitCount)
  )

  // Behavior state
  const [behavior, setBehavior] = useState<BehaviorState>(() => getBehaviorState())
  const [uiComplexity, setUIComplexity] = useState<'minimal' | 'standard' | 'rich' | 'maximal'>(() => getUIComplexity())
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Initialize on mount
  useEffect(() => {
    // Record visit
    const newMemory = recordVisit()
    setMemory(newMemory)
    setFamiliarityLevel(getFamiliarityLevel(newMemory.visitCount))

    // Update circadian state every minute
    const interval = setInterval(() => {
      const newCircadian = getCurrentCircadianState()
      setCircadian(newCircadian)
      setTheme(getCircadianTheme(newCircadian))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Update behavior-derived states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBehavior(getBehaviorState())
      setUIComplexity(getUIComplexity())
      setShowAdvanced(shouldShowAdvancedFeatures())
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Apply theme to CSS variables
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Set CSS variables for circadian theme
    root.style.setProperty('--circadian-bg-start', theme.background.start)
    root.style.setProperty('--circadian-bg-end', theme.background.end)
    root.style.setProperty('--circadian-accent', theme.accent)
    root.style.setProperty('--circadian-glow', theme.glow)
    root.style.setProperty('--circadian-text-primary', theme.text.primary)
    root.style.setProperty('--circadian-text-secondary', theme.text.secondary)
    root.style.setProperty('--circadian-speed', theme.speed.toString())
    root.style.setProperty('--circadian-intensity', theme.intensity.toString())
    root.style.setProperty('--circadian-particles', theme.particleDensity.toString())
    root.style.setProperty('--circadian-blur', `${theme.blurAmount}px`)

    // Set atmospheric properties as data attributes for debugging
    root.dataset.circadianPhase = circadian.phase
    root.dataset.familiarityLevel = familiarityLevel
    root.dataset.uiComplexity = uiComplexity
  }, [theme, circadian.phase, familiarityLevel, uiComplexity])

  // Actions
  const markSeen = useCallback((nodeId: string) => {
    markNodeSeen(nodeId)
    setMemory(getMemoryState())
  }, [])

  const recordNodeInteraction = useCallback((nodeId: string) => {
    recordInteraction(nodeId)
    setMemory(getMemoryState())
  }, [])

  const getNovelty = useCallback((nodeId: string) => {
    return getNoveltyScore(nodeId)
  }, [])

  const onScroll = useCallback(() => {
    trackScroll()
  }, [])

  const onHover = useCallback((duration: number) => {
    trackHover(duration)
  }, [])

  const onInteract = useCallback(() => {
    trackInteraction()
  }, [])

  const value: AtmosphereContextValue = {
    circadian,
    theme,
    memory,
    familiarityLevel,
    behavior,
    uiComplexity,
    showAdvanced,
    markSeen,
    recordNodeInteraction,
    getNovelty,
    onScroll,
    onHover,
    onInteract
  }

  return (
    <AtmosphereContext.Provider value={value}>
      {children}
    </AtmosphereContext.Provider>
  )
}

/**
 * Hook to access atmosphere context
 */
export function useAtmosphere() {
  const context = useContext(AtmosphereContext)
  if (!context) {
    throw new Error('useAtmosphere must be used within AtmosphereProvider')
  }
  return context
}

/**
 * Hook to track when a component is hovered
 */
export function useHoverTracking(nodeId?: string) {
  const { onHover, onInteract, markSeen } = useAtmosphere()
  const [hoverStart, setHoverStart] = useState<number | null>(null)

  const onMouseEnter = useCallback(() => {
    setHoverStart(Date.now())
    onInteract()
  }, [onInteract])

  const onMouseLeave = useCallback(() => {
    if (hoverStart) {
      const duration = Date.now() - hoverStart
      onHover(duration)

      // If hovered for >2 seconds, mark as seen
      if (nodeId && duration > 2000) {
        markSeen(nodeId)
      }

      setHoverStart(null)
    }
  }, [hoverStart, onHover, markSeen, nodeId])

  return { onMouseEnter, onMouseLeave }
}

/**
 * Hook to track scroll behavior in a component
 */
export function useScrollTracking() {
  const { onScroll } = useAtmosphere()

  useEffect(() => {
    const handleScroll = () => {
      onScroll()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onScroll])
}
