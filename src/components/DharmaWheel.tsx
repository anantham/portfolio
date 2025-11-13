'use client'

import { motion } from 'framer-motion'

interface DharmaWheelProps {
  size?: number
  className?: string
}

export default function DharmaWheel({ size = 200, className = '' }: DharmaWheelProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
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
          className="drop-shadow-lg"
        >
          {/* Outer rim */}
          <circle
            cx="100"
            cy="100"
            r="95"
            stroke="url(#dharmaGradient)"
            strokeWidth="2"
            fill="none"
          />

          {/* Inner rim */}
          <circle
            cx="100"
            cy="100"
            r="75"
            stroke="url(#dharmaGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />

          {/* Hub */}
          <circle
            cx="100"
            cy="100"
            r="20"
            fill="url(#hubGradient)"
            stroke="url(#dharmaGradient)"
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
                stroke="url(#spokeGradient)"
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
                fill="url(#dharmaGradient)"
                opacity="0.6"
              />
            )
          })}

          {/* Three jewels in the center - arranged symmetrically */}
          {Array.from({ length: 3 }, (_, i) => {
            const angle = (i * 120 - 90) * (Math.PI / 180) // Start from top, evenly spaced
            const radius = 8 // Distance from center
            const x = 100 + Math.cos(angle) * radius
            const y = 100 + Math.sin(angle) * radius
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#f59e0b" opacity="0.8" />
            )
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="dharmaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.5" />
            </linearGradient>

            <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.1" />
            </radialGradient>

            <linearGradient id="spokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
}