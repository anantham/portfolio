'use client'

import { motion } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useWanderingPhysics } from '@/hooks/useWanderingPhysics'

interface WanderingDharmaWheelProps {
  size?: number
  opacity?: number
  baseSpeed?: number
  disabled?: boolean
}

export default function WanderingDharmaWheel({
  size = 80,
  opacity = 0.25,
  baseSpeed = 0.3,
  disabled = false
}: WanderingDharmaWheelProps) {
  const mousePosition = useMousePosition()
  const position = useWanderingPhysics({
    mousePosition,
    wheelSize: size,
    baseSpeed: disabled ? 0 : baseSpeed
  })

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <motion.div
      className="fixed pointer-events-none select-none"
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2,
        zIndex: -1,
        opacity: prefersReducedMotion ? 0.1 : opacity
      }}
      animate={{
        left: position.x - size / 2,
        top: position.y - size / 2,
      }}
      transition={{
        type: "tween",
        ease: "linear",
        duration: 0.1
      }}
    >
      <motion.div
        animate={{
          rotate: prefersReducedMotion || disabled ? 0 : 360
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        className="dharma-wheel"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Outer rim */}
          <circle
            cx="100"
            cy="100"
            r="95"
            stroke="url(#wanderingDharmaGradient)"
            strokeWidth="2"
            fill="none"
          />

          {/* Inner rim */}
          <circle
            cx="100"
            cy="100"
            r="75"
            stroke="url(#wanderingDharmaGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />

          {/* Hub */}
          <circle
            cx="100"
            cy="100"
            r="20"
            fill="url(#wanderingHubGradient)"
            stroke="url(#wanderingDharmaGradient)"
            strokeWidth="1"
          />

          {/* Eight spokes representing the Noble Eightfold Path */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 45) * (Math.PI / 180)
            const x1 = 100 + Math.cos(angle) * 20
            const y1 = 100 + Math.sin(angle) * 20
            const x2 = 100 + Math.cos(angle) * 75
            const y2 = 100 + Math.sin(angle) * 75

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#wanderingSpokeGradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}

          {/* Dots on the rim representing interconnectedness */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i * 15) * (Math.PI / 180)
            const x = 100 + Math.cos(angle) * 85
            const y = 100 + Math.sin(angle) * 85

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill="url(#wanderingDharmaGradient)"
                opacity="0.6"
              />
            )
          })}

          {/* Three jewels in the center */}
          <circle cx="95" cy="95" r="3" fill="#f59e0b" opacity="0.6" />
          <circle cx="105" cy="95" r="3" fill="#f59e0b" opacity="0.6" />
          <circle cx="100" cy="108" r="3" fill="#f59e0b" opacity="0.6" />

          {/* Gradients - slightly more subtle for background wheel */}
          <defs>
            <linearGradient id="wanderingDharmaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.3" />
            </linearGradient>

            <radialGradient id="wanderingHubGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.05" />
            </radialGradient>

            <linearGradient id="wanderingSpokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Optional: Very subtle trail effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)`,
          filter: 'blur(2px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.05, 0.1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}