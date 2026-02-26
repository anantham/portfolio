'use client'

/* ================================================================== */
/* ConnectionThreads — SVG overlay for causal connection paths         */
/*                                                                     */
/* Renders curved bezier paths between adjacent wedge panels on the    */
/* mandala's outer orbit ring. Hovering a path reveals its causal      */
/* label; active panels highlight their adjacent connections.           */
/* ================================================================== */

import { motion } from 'framer-motion'

import {
  PATH_FACTORS,
  FACTOR_CONNECTIONS,
  PILLARS,
} from '@/data/mandalaData'

// --------------- Constants ---------------

/** Cubic-bezier used for all mandala transitions. */
const MANDALA_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

/** Distance from center to panel orbit, as fraction of container size. */
const ORBIT_RADIUS_FRACTION = 0.38

// --------------- Props ---------------

export interface ConnectionThreadsProps {
  activePanel: number | null
  activeConnection: number | null
  onActivateConnection: (index: number) => void
  onDeactivateConnection: () => void
  containerSize: number // px
}

// --------------- Helpers ---------------

/** Convert degrees to radians. */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Get the (x, y) position of a factor on the orbit circle.
 * Origin is at center of the container.
 */
function factorPosition(
  angleDeg: number,
  radius: number,
  center: number
): { x: number; y: number } {
  const rad = degToRad(angleDeg)
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  }
}

/**
 * Calculate the midpoint angle between two angles on the circle,
 * handling the wrap-around case (e.g. 225° → -90°/270°).
 */
function midpointAngle(a1: number, a2: number): number {
  const r1 = degToRad(a1)
  const r2 = degToRad(a2)
  // Use vector averaging to handle wrap-around correctly
  const mx = Math.cos(r1) + Math.cos(r2)
  const my = Math.sin(r1) + Math.sin(r2)
  return (Math.atan2(my, mx) * 180) / Math.PI
}

// --------------- Component ---------------

export default function ConnectionThreads({
  activePanel,
  activeConnection,
  onActivateConnection,
  onDeactivateConnection,
  containerSize,
}: ConnectionThreadsProps) {
  const center = containerSize / 2
  const orbitRadius = containerSize * ORBIT_RADIUS_FRACTION

  return (
    <svg
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      width={containerSize}
      height={containerSize}
      viewBox={`0 0 ${containerSize} ${containerSize}`}
    >
      {FACTOR_CONNECTIONS.map((conn, i) => {
        const fromFactor = PATH_FACTORS[conn.from]
        const toFactor = PATH_FACTORS[conn.to]

        // Start and end points on the orbit circle
        const p1 = factorPosition(fromFactor.angle, orbitRadius, center)
        const p2 = factorPosition(toFactor.angle, orbitRadius, center)

        // Control point: slightly inside the orbit at the midpoint angle
        const midAngle = midpointAngle(fromFactor.angle, toFactor.angle)
        const controlRadius = orbitRadius * 0.85
        const cp = factorPosition(midAngle, controlRadius, center)

        // Quadratic bezier path
        const d = `M ${p1.x} ${p1.y} Q ${cp.x} ${cp.y} ${p2.x} ${p2.y}`

        // Highlight when either connected panel is active, or this connection is hovered
        const isHighlighted =
          activePanel === conn.from ||
          activePanel === conn.to ||
          activeConnection === i

        // Highlight color: from-factor's pillar glowColor with increased alpha
        const pillar = PILLARS[fromFactor.pillar]
        const highlightColor = pillar.glowColor.replace('0.16', '0.6')

        return (
          <g key={`conn-${i}`}>
            {/* Invisible wide hit-area for hover/tap detection */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onMouseEnter={() => onActivateConnection(i)}
              onMouseLeave={onDeactivateConnection}
              onTouchStart={() => onActivateConnection(i)}
              onTouchEnd={onDeactivateConnection}
            />

            {/* Visible connection path */}
            <motion.path
              d={d}
              fill="none"
              animate={{
                stroke: isHighlighted
                  ? highlightColor
                  : 'rgba(245,158,11,0.06)',
                strokeWidth: isHighlighted ? 1.5 : 0.5,
                opacity: isHighlighted ? 1 : 0.3,
              }}
              transition={{
                duration: 0.4,
                ease: MANDALA_EASE,
              }}
            />

            {/* Causal label tooltip at control point */}
            {activeConnection === i && (
              <motion.text
                x={cp.x}
                y={cp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-amber-200/80 text-[10px] font-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: MANDALA_EASE }}
              >
                {conn.causalLabel}
              </motion.text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
