'use client'

/* ================================================================== */
/* VimuttiSpokes — SVG overlay for liberation revelation               */
/*                                                                     */
/* Renders three pillar-to-hub spokes and the inner triangle           */
/* (pillar-to-pillar edges) that fade in when all 8 panels have been   */
/* visited and vimutti is revealed.                                     */
/* ================================================================== */

import { motion } from 'framer-motion'

import {
  PILLAR_TO_VIMUTTI,
  PILLAR_CONNECTIONS,
  PILLARS,
  PillarId,
} from '@/data/mandalaData'

// --------------- Constants ---------------

/** Angular center of each pillar's factor group (degrees). */
const PILLAR_ANGLES: Record<PillarId, number> = {
  panna: -67.5, // midpoint of -90 and -45
  sila: 45, // midpoint of 0, 45, 90
  samadhi: 180, // midpoint of 135, 180, 225
}

/** Cubic-bezier used for all mandala transitions. */
const MANDALA_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// --------------- Props ---------------

export interface VimuttiSpokesProps {
  revealed: boolean
  containerSize: number
}

// --------------- Helpers ---------------

/** Convert degrees to radians. */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Get the (x, y) position at a given angle and radius from center.
 */
function pointOnCircle(
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

// --------------- Component ---------------

export default function VimuttiSpokes({
  revealed,
  containerSize,
}: VimuttiSpokesProps) {
  const center = containerSize / 2
  const spokeLength = containerSize * 0.22
  const triangleRadius = containerSize * 0.2

  return (
    <svg
      aria-hidden
      className="absolute inset-0 pointer-events-none z-20"
      width={containerSize}
      height={containerSize}
      viewBox={`0 0 ${containerSize} ${containerSize}`}
    >
      {/* --- Pillar-to-hub spokes --- */}
      {PILLAR_TO_VIMUTTI.map((pv, i) => {
        const pillarConfig = PILLARS[pv.pillar]
        const angle = PILLAR_ANGLES[pv.pillar]
        const endpoint = pointOnCircle(angle, spokeLength, center)
        const midpoint = pointOnCircle(angle, spokeLength / 2, center)

        // Increase glow alpha from 0.16 to 0.4
        const strokeColor = pillarConfig.glowColor.replace('0.16', '0.4')

        // Small offset for label readability
        const labelOffset = 8
        const rad = degToRad(angle)
        const labelX = midpoint.x + labelOffset * Math.cos(rad + Math.PI / 2)
        const labelY = midpoint.y + labelOffset * Math.sin(rad + Math.PI / 2)

        return (
          <motion.g
            key={`spoke-${pv.pillar}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{
              delay: 0.3 + i * 0.4,
              duration: 2,
              ease: MANDALA_EASE,
            }}
          >
            <line
              x1={center}
              y1={center}
              x2={endpoint.x}
              y2={endpoint.y}
              stroke={strokeColor}
              strokeWidth={1}
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="start"
              dominantBaseline="middle"
              className="fill-amber-200/60 text-[8px] font-serif"
            >
              {pv.label}
            </text>
          </motion.g>
        )
      })}

      {/* --- Inner triangle edges (pillar-to-pillar) --- */}
      {PILLAR_CONNECTIONS.map((pc, i) => {
        const fromAngle = PILLAR_ANGLES[pc.from]
        const toAngle = PILLAR_ANGLES[pc.to]
        const p1 = pointOnCircle(fromAngle, triangleRadius, center)
        const p2 = pointOnCircle(toAngle, triangleRadius, center)

        // Midpoint of the line for label placement
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2 - 6 // 6px above the line

        return (
          <motion.g
            key={`triangle-${pc.from}-${pc.to}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{
              delay: 1.5 + i * 0.3,
              duration: 2,
              ease: MANDALA_EASE,
            }}
          >
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(245,158,11,0.2)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-amber-200/40 text-[7px] font-serif italic"
            >
              {pc.causalLabel}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}
