'use client'

import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useMotionStrategy } from '@/hooks/useMotionStrategy'
import { getWheelMotionProfile } from '@/lib/content'
import { useLens } from '@/contexts/LensContext'
import DharmaWheel from '@/components/DharmaWheel'

interface WanderingDharmaWheelProps {
  size?: number
  opacity?: number
  baseSpeed?: number
  disabled?: boolean
}

export default function WanderingDharmaWheel({
  size,
  opacity,
  baseSpeed,
  disabled = false
}: WanderingDharmaWheelProps) {
  const { selectedLens } = useLens()
  const profile = useMemo(() => getWheelMotionProfile(selectedLens), [selectedLens])
  const wheelSize = size ?? profile.visual.size
  const wheelOpacity = opacity ?? profile.visual.opacity

  const strategyConfig = useMemo(() => {
    if (baseSpeed !== undefined) {
      return { ...profile.parameters, baseSpeed }
    }
    return profile.parameters
  }, [profile.parameters, baseSpeed])

  const mousePosition = useMousePosition()
  const { position } = useMotionStrategy({
    strategyType: profile.strategy.type,
    config: strategyConfig,
    mousePosition: disabled ? null : mousePosition,
    disabled
  })

  const clampedPosition = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : wheelSize
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : wheelSize
    const pad = wheelSize / 2
    return {
      x: Math.max(pad, Math.min(viewportWidth - pad, position.x)),
      y: Math.max(pad, Math.min(viewportHeight - pad, position.y))
    }
  }, [position.x, position.y, wheelSize])

  const clampedX = clampedPosition.x
  const clampedY = clampedPosition.y

  const traceCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const samplesRef = useRef<Array<{ x: number; y: number; time: number }>>([])

  useEffect(() => {
    const canvas = traceCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)
      samplesRef.current = []
    }

    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    const canvas = traceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = performance.now() / 1000
    const fadeWindow = 20
    samplesRef.current.push({ x: clampedX, y: clampedY, time: now })
    samplesRef.current = samplesRef.current.filter(sample => now - sample.time <= fadeWindow)

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    ctx.clearRect(0, 0, width, height)

    const samples = samplesRef.current
    if (samples.length < 2) return

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1]
      const curr = samples[i]
      const age = now - curr.time
      const alpha = Math.max(0, 1 - age / fadeWindow)
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(curr.x, curr.y)
      ctx.strokeStyle = `rgba(248, 196, 113, ${alpha})`
      ctx.stroke()
    }
  }, [clampedX, clampedY])

  useEffect(() => {
    const canvas = traceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    samplesRef.current = []
  }, [profile.strategy.name, disabled])

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <>
      <canvas
        ref={traceCanvasRef}
        className="fixed top-0 left-0 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      />
      <motion.div
        className="fixed pointer-events-none select-none"
        style={{
          left: clampedX - wheelSize / 2,
          top: clampedY - wheelSize / 2,
          zIndex: 1,
          opacity: prefersReducedMotion ? 0.1 : wheelOpacity
        }}
        animate={{
          left: clampedX - wheelSize / 2,
          top: clampedY - wheelSize / 2
        }}
        transition={{
          type: "tween",
          ease: "linear",
          duration: 0.1
        }}
      >
        <DharmaWheel
          size={wheelSize}
          className={`transition-opacity duration-500 ${disabled ? 'opacity-20' : ''}`}
        />

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
    </>
  )
}
