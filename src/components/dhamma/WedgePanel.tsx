'use client'

/* ================================================================== */
/* WedgePanel — Single wedge of the Breathing Mandala                 */
/* Crossfades between resting and illuminated image states on         */
/* hover/tap, with a slow breathing opacity pulse while at rest.      */
/* ================================================================== */

import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

import { PathFactor, PILLARS } from '@/data/mandalaData'
import { panelPlaceholder } from '@/lib/mandalaAssets'

// --------------- Constants ---------------

/** Cubic-bezier used for all mandala transitions. */
const MANDALA_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

/** Duration of the resting/illuminated crossfade in seconds. */
const CROSSFADE_DURATION = 0.6

/** Duration of one full breathing cycle in seconds. */
const BREATHE_DURATION = 4.75

// --------------- Props ---------------

export interface WedgePanelProps {
  factor: PathFactor
  isActive: boolean
  isVisited: boolean
  /** True when another panel is active — dims this one. */
  isDimmed: boolean
  onActivate: () => void
  onDeactivate: () => void
  /** Staggered breathing offset in seconds. */
  breatheDelay: number
}

// --------------- Component ---------------

export default function WedgePanel({
  factor,
  isActive,
  isVisited,
  isDimmed,
  onActivate,
  onDeactivate,
  breatheDelay,
}: WedgePanelProps) {
  const pillar = PILLARS[factor.pillar]

  // --- Reduced motion preference ---
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Track image load errors so we can fall back to SVG placeholders
  const [restingError, setRestingError] = useState(false)
  const [illuminatedError, setIlluminatedError] = useState(false)

  const restingSrc = restingError
    ? panelPlaceholder(factor.pillar, false)
    : factor.restingImage

  const illuminatedSrc = illuminatedError
    ? panelPlaceholder(factor.pillar, true)
    : factor.illuminatedImage

  // --- Breathing opacity for resting image ---
  const breatheKeyframes = isVisited
    ? [0.25, 0.35, 0.25]
    : [0.15, 0.22, 0.15]

  function getRestingOpacity() {
    if (isActive) return 0
    if (isDimmed) return 0.4
    // When breathing, framer-motion keyframes handle it
    return undefined
  }

  const restingOpacityValue = getRestingOpacity()
  const isBreathing = !isActive && !isDimmed

  // --- Glow box-shadow ---
  const glowShadow = `0 0 24px 4px ${pillar.glowColor}, inset 0 0 12px 2px ${pillar.glowColor}`

  // --- Keyboard handler ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isActive) {
          onDeactivate()
        } else {
          onActivate()
        }
      }
    },
    [isActive, onActivate, onDeactivate]
  )

  // --- Click/tap handler ---
  const handleClick = useCallback(() => {
    if (isActive) {
      onDeactivate()
    } else {
      onActivate()
    }
  }, [isActive, onActivate, onDeactivate])

  // --- Aria label ---
  const ariaLabel = `${factor.name} (${factor.pali}): ${factor.illustration}`

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        width: 'var(--panel-width, 100px)',
        height: 'var(--panel-height, 150px)',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: '12px',
      }}
      className="outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      {/* ---- Resting image layer ---- */}
      <motion.img
        src={restingSrc}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setRestingError(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '12px',
        }}
        // Breathing animation when at rest; static opacity otherwise
        {...(isBreathing
          ? prefersReducedMotion
            ? {
                // Reduced motion: use static midpoint opacity instead of breathing
                animate: { opacity: breatheKeyframes[1] },
                transition: {
                  opacity: { duration: 0, ease: MANDALA_EASE },
                },
              }
            : {
                animate: { opacity: breatheKeyframes },
                transition: {
                  opacity: {
                    duration: BREATHE_DURATION,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: breatheDelay,
                  },
                },
              }
          : {
              animate: { opacity: restingOpacityValue },
              transition: {
                opacity: {
                  duration: prefersReducedMotion ? 0 : CROSSFADE_DURATION,
                  ease: MANDALA_EASE,
                },
              },
            })}
      />

      {/* ---- Illuminated image layer ---- */}
      <motion.img
        src={illuminatedSrc}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setIlluminatedError(true)}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{
          opacity: {
            duration: prefersReducedMotion ? 0 : CROSSFADE_DURATION,
            ease: MANDALA_EASE,
          },
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '12px',
        }}
      />

      {/* ---- Pillar glow border ---- */}
      <motion.div
        aria-hidden
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{
          opacity: {
            duration: prefersReducedMotion ? 0 : CROSSFADE_DURATION,
            ease: MANDALA_EASE,
          },
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          boxShadow: glowShadow,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}
