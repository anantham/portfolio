/**
 * Tiny Vaithya - Main Component
 *
 * The pixel mascot that explores your website and guides visitors.
 * Integrates with atmosphere context for time-aware, memory-aware behavior.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAtmosphere } from '@/contexts/AtmosphereContext'
import { VaithyaStateMachine } from '@/lib/vaithya-state-machine'
import VaithyaSprite from './VaithyaSprite'
import type { VaithyaBehavior } from '@/lib/vaithya-types'
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

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
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

  // Initial behavior: First visit
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
      // Returning visitor: Start near projects
      stateMachineRef.current.applyBehavior({
        action: 'STAY_IDLE',
        mood: circadian.phase === 'night' ? 'sleepy' : 'calm',
      })
    }
  }, [memory.visitCount, circadian.phase])

  // Costume based on lens and time
  useEffect(() => {
    if (!stateMachineRef.current) return

    const getCostume = () => {
      if (circadian.phase === 'night') return 'monk_robe'
      if (circadian.energy > 0.7) return 'builder_hat'
      return 'none'
    }

    const costume = getCostume()
    const currentState = stateMachineRef.current.getState()

    if (currentState.costume !== costume) {
      stateMachineRef.current.applyBehavior({
        action: 'STAY_IDLE',
        costume,
      })
    }
  }, [circadian.phase, circadian.energy])

  // React to user idle
  useEffect(() => {
    if (!stateMachineRef.current) return

    let idleTimer: NodeJS.Timeout

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

    // Track user activity
    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('scroll', resetIdle)
    window.addEventListener('click', resetIdle)
    window.addEventListener('keydown', resetIdle)

    resetIdle() // Start timer

    return () => {
      clearTimeout(idleTimer)
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('scroll', resetIdle)
      window.removeEventListener('click', resetIdle)
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

  // Section discovery behavior
  useEffect(() => {
    if (!stateMachineRef.current) return
    if (uiComplexity === 'minimal') return // Respect minimal UI

    // Simple behavior: Point to projects section if unseen
    const projectsSection = document.getElementById('projects-section')
    if (projectsSection && !memory.seenNodes.has('projects-section')) {
      const rect = projectsSection.getBoundingClientRect()

      // Is it visible?
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setTimeout(() => {
          stateMachineRef.current?.applyBehavior({
            action: 'POINT_AT_ELEMENT',
            targetId: 'projects-section',
            position: {
              x: rect.left - 50,
              y: rect.top + 20,
            },
            mood: 'playful',
          })
        }, 2000)
      }
    }
  }, [memory.seenNodes, uiComplexity])

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
