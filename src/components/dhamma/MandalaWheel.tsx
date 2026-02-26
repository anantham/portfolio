'use client'

/* ================================================================== */
/* MandalaWheel — Layered composition of the Breathing Mandala         */
/*                                                                     */
/* Three layers:                                                       */
/*   1. ROTATING structural ornament (rim + spoke lines, 96s/rev)      */
/*   2. STATIC radial wedge panels (positioned at orbit angles)        */
/*   3. CENTER hub with resting/illuminated crossfade                  */
/* ================================================================== */

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'

import { PATH_FACTORS } from '@/data/mandalaData'
import { hubPlaceholder } from '@/lib/mandalaAssets'
import WedgePanel from './WedgePanel'

// --------------- Constants ---------------

/** Time for one full revolution of the structural layer (seconds). */
const SPIN_DURATION_SEC = 96

/** Distance from center to panel orbit, as % of container size. */
const PANEL_RADIUS_PERCENT = 38

/** Cubic-bezier used for all mandala transitions. */
const MANDALA_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// --------------- Props ---------------

export interface MandalaWheelProps {
  activePanel: number | null
  visitedPanels: Set<number>
  vimuttiRevealed: boolean
  onActivatePanel: (index: number) => void
  onDeactivatePanel: () => void
}

// --------------- Component ---------------

export default function MandalaWheel({
  activePanel,
  visitedPanels,
  vimuttiRevealed,
  onActivatePanel,
  onDeactivatePanel,
}: MandalaWheelProps) {
  // --- Reduced motion preference ---
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // --- Continuous rotation via useAnimationFrame ---
  const rotation = useMotionValue(0)
  const startTimeRef = useRef<number | null>(null)

  useAnimationFrame((elapsed) => {
    if (prefersReducedMotion) return
    if (startTimeRef.current === null) {
      startTimeRef.current = elapsed
    }
    const seconds = (elapsed - startTimeRef.current) / 1000
    rotation.set((seconds / SPIN_DURATION_SEC) * 360 % 360)
  })

  return (
    <div
      className="relative"
      style={{
        width: 'min(90vw, 90vh)',
        height: 'min(90vw, 90vh)',
        containerType: 'inline-size',
      }}
    >
      {/* ============================================================ */}
      {/* Layer 1 — Structural ornament (ROTATES)                      */}
      {/* ============================================================ */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ rotate: rotation }}
      >
        {/* Rim placeholder */}
        <div className="absolute inset-[5%] rounded-full border border-amber-900/20" />

        {/* 8 spoke lines radiating from center */}
        {PATH_FACTORS.map((factor) => (
          <div
            key={`spoke-${factor.index}`}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              width: '45%',
              height: '1px',
              transformOrigin: 'left center',
              transform: `rotate(${factor.angle}deg)`,
              background:
                'linear-gradient(to right, rgba(245,158,11,0.3), rgba(245,158,11,0.05))',
            }}
          />
        ))}
      </motion.div>

      {/* ============================================================ */}
      {/* Layer 2 — Wedge panels (STATIC, positioned radially)         */}
      {/* ============================================================ */}
      {PATH_FACTORS.map((factor) => (
        <div
          key={`panel-${factor.index}`}
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${factor.angle}deg) translate(${PANEL_RADIUS_PERCENT}cqi) rotate(${-factor.angle}deg)`,
            ['--panel-width' as string]: '12cqi',
            ['--panel-height' as string]: '18cqi',
          }}
        >
          <WedgePanel
            factor={factor}
            isActive={activePanel === factor.index}
            isVisited={visitedPanels.has(factor.index)}
            isDimmed={activePanel !== null && activePanel !== factor.index}
            onActivate={() => onActivatePanel(factor.index)}
            onDeactivate={onDeactivatePanel}
            breatheDelay={factor.index * 0.6}
          />
        </div>
      ))}

      {/* ============================================================ */}
      {/* Layer 3 — Hub (CENTER)                                       */}
      {/* ============================================================ */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ width: '20cqi', height: '20cqi' }}
      >
        {/* Hub resting state */}
        <motion.img
          src={hubPlaceholder(false)}
          alt=""
          aria-hidden
          draggable={false}
          animate={{ opacity: vimuttiRevealed ? 0 : 0.15 }}
          transition={{
            opacity: { duration: 2.5, ease: MANDALA_EASE },
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '50%',
          }}
        />

        {/* Hub illuminated state */}
        <motion.img
          src={hubPlaceholder(true)}
          alt=""
          aria-hidden
          draggable={false}
          animate={{ opacity: vimuttiRevealed ? 1 : 0 }}
          transition={{
            opacity: { duration: 2.5, ease: MANDALA_EASE },
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '50%',
          }}
        />

        {/* Vimutti text */}
        <motion.div
          animate={{ opacity: vimuttiRevealed ? 1 : 0 }}
          transition={{
            opacity: { duration: 1, delay: 0.5, ease: MANDALA_EASE },
          }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-serif text-amber-200/90 text-lg tracking-widest">
            Vimutti
          </span>
          <span className="text-amber-200/50 text-xs tracking-wider mt-1">
            Liberation
          </span>
        </motion.div>
      </div>
    </div>
  )
}
