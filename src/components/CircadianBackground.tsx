/**
 * Circadian Background
 *
 * Dynamic background that responds to time of day.
 * Subtle atmospheric layer that makes time felt, not seen.
 */

'use client'

import { useAtmosphere, useScrollTracking } from '@/contexts/AtmosphereContext'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function CircadianBackground() {
  const { circadian, theme } = useAtmosphere()
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number }[]>([])

  // Track scrolling behavior
  useScrollTracking()

  // Generate stars for night phases
  useEffect(() => {
    if (circadian.phase === 'night' || circadian.phase === 'dusk') {
      const starCount = Math.floor(50 * theme.particleDensity)
      const newStars = Array.from({ length: starCount }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2
      }))
      setStars(newStars)
    } else {
      setStars([])
    }
  }, [circadian.phase, theme.particleDensity])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Base gradient - animated transition */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `linear-gradient(135deg, ${theme.background.start} 0%, ${theme.background.end} 100%)`
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />

      {/* Atmospheric overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: circadian.contemplation * 0.3
        }}
        transition={{ duration: 2 }}
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
        }}
      />

      {/* Stars (night/dusk only) */}
      {stars.length > 0 && (
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                backgroundColor: theme.glow,
                opacity: star.opacity,
                filter: `blur(${star.size * 0.5}px)`
              }}
              animate={{
                opacity: [star.opacity, star.opacity * 0.5, star.opacity],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      )}

      {/* Dawn/dusk glow */}
      {(circadian.phase === 'dawn' || circadian.phase === 'dusk') && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: circadian.warmth * 0.4 }}
          transition={{ duration: 2 }}
          style={{
            background: `radial-gradient(ellipse at ${circadian.phase === 'dawn' ? 'left' : 'right'} center, ${theme.glow} 0%, transparent 50%)`
          }}
        />
      )}

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  )
}
