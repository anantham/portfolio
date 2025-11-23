/**
 * Tiny Vaithya - Main Component
 *
 * The pixel mascot that explores your website and guides visitors.
 * Integrates with atmosphere context for time-aware, memory-aware behavior.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAtmosphere } from '@/contexts/AtmosphereContext'
import { useLens } from '@/contexts/LensContext'
import { VaithyaStateMachine } from '@/lib/vaithya-state-machine'
import VaithyaSprite from './VaithyaSprite'
import type { VaithyaBehavior, VaithyaCostume, VaithyaMood } from '@/lib/vaithya-types'
import { ANIMATION_SEQUENCES } from '@/lib/vaithya-types'

export default function TinyVaithya() {
  const {
    circadian,
    theme,
    memory,
    familiarityLevel,
    behavior,
    uiComplexity,
    getNovelty,
  } = useAtmosphere()

  const { selectedLens } = useLens()

  const [vaithyaState, setVaithyaState] = useState<ReturnType<VaithyaStateMachine['getState']> | null>(null)
  const stateMachineRef = useRef<VaithyaStateMachine | null>(null)
  const frameRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(Date.now())

  // Initialize state machine
  useEffect(() => {
    stateMachineRef.current = new VaithyaStateMachine()
    setVaithyaState(stateMachineRef.current.getState())

    // Handle reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      stateMachineRef.current.setReducedMotion(true)
    }

    // Keyboard shortcut: Alt+V to toggle visibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        stateMachineRef.current?.toggleVisibility()
        setVaithyaState(stateMachineRef.current!.getState())
      }
    }

    // v2.0: Save position when user leaves
    const savePosition = () => {
      if (!stateMachineRef.current) return
      const { saveVaithyaPosition } = require('@/lib/memory')
      const currentState = stateMachineRef.current.getState()
      saveVaithyaPosition(currentState.position.x, currentState.position.y)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('beforeunload', savePosition)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) savePosition()
    })

    return () => {
      savePosition() // Save on unmount
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('beforeunload', savePosition)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  // Update loop
  useEffect(() => {
    const animate = () => {
      if (!stateMachineRef.current) return

      const now = Date.now()
      const deltaTime = now - lastUpdateRef.current
      lastUpdateRef.current = now

      stateMachineRef.current.update(deltaTime)
      setVaithyaState(stateMachineRef.current.getState())

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  // v2.0: Initial behavior with position memory
  useEffect(() => {
    if (!stateMachineRef.current) return

    if (memory.visitCount === 1) {
      // First visit: Enter from left, walk to hero area
      setTimeout(() => {
        stateMachineRef.current?.applyBehavior({
          action: 'ENTER_SCENE',
          position: { x: 100, y: window.innerHeight - 100 },
          mood: 'curious',
        })
      }, 1000)
    } else {
      // Returning visitor: Restore last position or start at default
      const { getVaithyaPosition } = require('@/lib/memory')
      const lastPos = getVaithyaPosition()

      if (lastPos) {
        // Start where they left off - recreate state machine with saved position
        stateMachineRef.current = new VaithyaStateMachine(lastPos)
        setVaithyaState(stateMachineRef.current.getState())
      }

      stateMachineRef.current.applyBehavior({
        action: 'STAY_IDLE',
        mood: circadian.phase === 'night' ? 'sleepy' : 'calm',
      })
    }
  }, [memory.visitCount, circadian.phase])

  // v2.5: Costume based on lens and time with transition reactions
  useEffect(() => {
    if (!stateMachineRef.current) return

    const getCostume = (): VaithyaCostume => {
      // Night time: monk robe (contemplative)
      if (circadian.phase === 'night') return 'monk_robe'

      // Lens-based costumes
      if (selectedLens) {
        switch (selectedLens) {
          case 'engineer':
            return 'builder_hat'
          case 'lw-math':
            return 'wizard_cap'
          case 'buddhist':
            return 'monk_robe'
          case 'embodied':
            return 'leaf_crown'
        }
      }

      // Default: builder hat during high energy
      if (circadian.energy > 0.7) return 'builder_hat'

      return 'none'
    }

    const costume = getCostume()
    const currentState = stateMachineRef.current.getState()

    if (currentState.costume !== costume) {
      // v2.5: Play transition animation when costume changes due to lens selection
      if (selectedLens && currentState.state === 'IDLE') {
        // Look around in wonder at the costume change
        stateMachineRef.current.playOneShotAnimation('look_around')

        // Apply costume after animation
        setTimeout(() => {
          stateMachineRef.current?.applyBehavior({
            action: 'STAY_IDLE',
            costume,
          })
        }, 2500) // After look_around completes
      } else {
        // No lens change, just update costume
        stateMachineRef.current.applyBehavior({
          action: 'STAY_IDLE',
          costume,
        })
      }
    }
  }, [circadian.phase, circadian.energy, selectedLens])

  // React to user idle and celebrate clicks
  useEffect(() => {
    if (!stateMachineRef.current) return

    let idleTimer: NodeJS.Timeout
    let lastCelebration = 0

    const resetIdle = () => {
      clearTimeout(idleTimer)

      // Notify state machine of activity
      stateMachineRef.current?.queueEvent({
        type: 'USER_ACTIVE',
        timestamp: Date.now(),
      })

      // Set new idle timer
      idleTimer = setTimeout(() => {
        stateMachineRef.current?.queueEvent({
          type: 'USER_IDLE',
          timestamp: Date.now(),
        })
      }, 45000) // 45 seconds
    }

    // v2.5: Celebrate meaningful clicks
    const handleClick = (e: MouseEvent) => {
      resetIdle()

      // Celebrate clicks on buttons, links, interactive elements
      const target = e.target as HTMLElement
      const isInteractive = target.closest('button, a, [role="button"], [data-project-id]')

      if (isInteractive && Date.now() - lastCelebration > 10000) {
        // Celebrate max once per 10 seconds
        lastCelebration = Date.now()
        stateMachineRef.current?.queueEvent({
          type: 'CELEBRATE',
          timestamp: Date.now(),
        })
      }
    }

    // Track user activity
    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('scroll', resetIdle)
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', resetIdle)

    resetIdle() // Start timer

    return () => {
      clearTimeout(idleTimer)
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('scroll', resetIdle)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', resetIdle)
    }
  }, [])

  // React to fast scrolling
  useEffect(() => {
    if (!stateMachineRef.current) return

    if (behavior.scrollSpeed === 'fast') {
      stateMachineRef.current.applyBehavior({
        action: 'STAY_OUT_OF_WAY',
      })
    }
  }, [behavior.scrollSpeed])

  // v2.0: Context-aware mood system
  useEffect(() => {
    if (!stateMachineRef.current) return

    const updateMood = () => {
      if (!stateMachineRef.current) return
      const currentState = stateMachineRef.current.getState()

      // Don't interrupt active actions
      if (currentState.state !== 'IDLE' && currentState.state !== 'SITTING') return

      let newMood: VaithyaMood | null = null

      // Time-based moods (highest priority)
      if (circadian.phase === 'night') {
        newMood = 'sleepy'
      } else if (circadian.phase === 'dawn' && circadian.energy < 0.4) {
        newMood = 'calm'
      }

      // Behavior-based moods
      else if (behavior.scrollSpeed === 'fast') {
        // Already handled by STAY_OUT_OF_WAY action
        return
      } else if (behavior.hoverDepth === 'deep' && behavior.interactionDensity > 3) {
        newMood = 'focused'
      }

      // Novelty-based moods
      else if (familiarityLevel === 'newcomer') {
        newMood = 'curious'
      } else if (familiarityLevel === 'intimate') {
        newMood = 'playful'
      }

      // Session duration moods
      else if (behavior.sessionDuration > 600) {
        // 10+ minutes: more relaxed
        newMood = 'calm'
      } else if (behavior.sessionDuration > 1800 && circadian.energy > 0.6) {
        // 30+ minutes during day: playful energy
        newMood = 'playful'
      }

      // Default based on time energy
      else if (circadian.energy > 0.7) {
        newMood = 'playful'
      } else if (circadian.energy < 0.3) {
        newMood = 'calm'
      } else {
        newMood = 'curious'
      }

      // Only update if mood changed
      if (newMood && currentState.mood !== newMood) {
        stateMachineRef.current.applyBehavior({
          action: 'STAY_IDLE',
          mood: newMood,
        })
      }
    }

    // Check mood every 30 seconds
    const interval = setInterval(updateMood, 30000)
    updateMood() // Initial check

    return () => clearInterval(interval)
  }, [
    circadian.phase,
    circadian.energy,
    behavior.scrollSpeed,
    behavior.hoverDepth,
    behavior.interactionDensity,
    familiarityLevel,
    behavior.sessionDuration,
  ])

  // v2.0: Contextual idle variant behaviors
  useEffect(() => {
    if (!stateMachineRef.current) return

    const playIdleVariant = () => {
      if (!stateMachineRef.current) return
      const currentState = stateMachineRef.current.getState()

      // Only play variants when truly idle or sitting
      if (currentState.state !== 'IDLE' && currentState.state !== 'SITTING') return
      if (currentState.isReducedMotion) return

      // Random chance for each variant
      const rand = Math.random()

      if (rand < 0.15) {
        // 15% chance: look around when idle
        stateMachineRef.current.playOneShotAnimation('look_around')
      } else if (rand < 0.20) {
        // 5% chance: scratch head (subtle curiosity)
        stateMachineRef.current.playOneShotAnimation('scratch_head')
      } else if (rand < 0.23 && behavior.sessionDuration > 300) {
        // 3% chance after 5min: stretch (long session)
        stateMachineRef.current.playOneShotAnimation('stretch')
      }
    }

    // Check every 5 seconds for idle variants
    const interval = setInterval(playIdleVariant, 5000)

    return () => clearInterval(interval)
  }, [behavior.sessionDuration])

  // v2.5: Intelligent project discovery with climb/peek/point behaviors
  useEffect(() => {
    if (!stateMachineRef.current) return
    if (uiComplexity === 'minimal') return // Respect minimal UI

    const discoverProjects = () => {
      // Find all project cards and sections
      const projectElements = [
        ...Array.from(document.querySelectorAll('[data-project-id]')),
        ...Array.from(document.querySelectorAll('[id$="-section"]')),
      ] as HTMLElement[]

      if (projectElements.length === 0) return

      // Score each element by novelty
      const scoredElements = projectElements
        .map(el => {
          const id = el.id || el.getAttribute('data-project-id') || ''
          const novelty = getNovelty(id)
          const rect = el.getBoundingClientRect()
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0

          return {
            element: el,
            id,
            novelty,
            isVisible,
            rect,
          }
        })
        .filter(item => item.isVisible && item.novelty > 0.5) // Only novel items
        .sort((a, b) => b.novelty - a.novelty) // Highest novelty first

      // Choose behavior based on element type and novelty
      if (scoredElements.length > 0) {
        const target = scoredElements[0]
        const isProjectCard = target.element.hasAttribute('data-project-id')
        const isSection = target.id.endsWith('-section')

        setTimeout(() => {
          // v2.5: Different behaviors for different elements
          if (isProjectCard && target.novelty > 0.9 && familiarityLevel !== 'newcomer') {
            // Highly novel project card + not first visit = climb on it!
            stateMachineRef.current?.applyBehavior({
              action: 'CLIMB_ON_ELEMENT',
              targetId: target.id,
              mood: 'playful',
              cooldown: 20000,
            })
          } else if (isSection && memory.visitCount === 1) {
            // First visit to new section = peek first
            stateMachineRef.current?.applyBehavior({
              action: 'PEEK_AT_ELEMENT',
              targetId: target.id,
              mood: 'curious',
              cooldown: 15000,
            })
          } else {
            // Default: just point
            stateMachineRef.current?.applyBehavior({
              action: 'POINT_AT_ELEMENT',
              targetId: target.id,
              position: {
                x: Math.max(20, target.rect.left - 50),
                y: target.rect.top + target.rect.height / 2 - 16,
              },
              mood: target.novelty > 0.8 ? 'curious' : 'playful',
              cooldown: 15000,
            })
          }
        }, 2000)
      }
    }

    // Check on initial render and when seen nodes change
    const timeout = setTimeout(discoverProjects, 1500)

    // Also check when scrolling stops
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(discoverProjects, 1000)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      clearTimeout(timeout)
      clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [memory.seenNodes, uiComplexity, getNovelty, familiarityLevel, memory.visitCount])

  if (!vaithyaState || !vaithyaState.isVisible) {
    return null
  }

  // Current animation frame
  const sequence = ANIMATION_SEQUENCES[vaithyaState.currentAnimation]
  const currentFrame = vaithyaState.frameIndex % sequence.frames.length

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="fixed pointer-events-none z-[9998]"
      style={{
        left: vaithyaState.position.x,
        top: vaithyaState.position.y,
        transition: vaithyaState.isReducedMotion
          ? 'none'
          : 'left 0.1s linear, top 0.1s linear',
      }}
    >
      <VaithyaSprite
        animation={vaithyaState.currentAnimation}
        frameIndex={currentFrame}
        direction={vaithyaState.direction}
        mood={vaithyaState.mood}
        costume={vaithyaState.costume}
        color={theme.accent}
      />

      {/* Debug info (only in dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-0 text-xs text-zen-500 whitespace-nowrap pointer-events-none">
          {vaithyaState.state} | {vaithyaState.mood}
        </div>
      )}
    </div>
  )
}
