'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useMotionStrategy } from '@/hooks/useMotionStrategy'
import { getWheelMotionProfile } from '@/lib/content'
import { useLens } from '@/contexts/LensContext'
import { useOrientation } from '@/contexts/OrientationContext'
import DharmaWheel from '@/components/DharmaWheel'

const HERO_SIZE = 160
const AWAKEN_TIMEOUT_MS = 10000

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
  const { activeCategory } = useOrientation()
  const profile = useMemo(
    () => getWheelMotionProfile(selectedLens, activeCategory),
    [selectedLens, activeCategory]
  )
  const targetSize = size ?? profile.visual.size
  const wheelOpacity = opacity ?? profile.visual.opacity

  // ── Mount guard — prevent SSR position flash (window undefined on server) ────
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ── Awakening state (declared early so strategy can use it) ──────────────────
  const [awakened, setAwakened] = useState(false)
  // True for ~3s after awakening so we use a slow spring for the initial drift
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Animated size: starts at HERO_SIZE, shrinks to targetSize on awakening
  const sizeMotionValue = useMotionValue(HERO_SIZE)
  const [renderSize, setRenderSize] = useState(HERO_SIZE)

  // Stable viewport center — used for hero position and strategy seed
  const viewportCenter = useMemo(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
  }), [])

  // Strategy is disabled until awakening so it initialises at viewportCenter
  // (not at the top-left corner) the moment it first runs
  const strategyConfig = useMemo(() => {
    const base = baseSpeed !== undefined
      ? { ...profile.parameters, baseSpeed }
      : profile.parameters
    return { ...base, initialX: viewportCenter.x, initialY: viewportCenter.y }
  }, [profile.parameters, baseSpeed, viewportCenter])

  const mousePosition = useMousePosition()
  const { position } = useMotionStrategy({
    strategyType: profile.strategy.type,
    config: strategyConfig,
    mousePosition: disabled ? null : mousePosition,
    disabled: disabled || !awakened
  })

  useEffect(() => {
    return sizeMotionValue.on('change', (v) => setRenderSize(Math.round(v)))
  }, [sizeMotionValue])

  useEffect(() => {
    if (awakened || disabled) return

    const doAwaken = () => {
      setAwakened(true)
      setIsTransitioning(true)
      // Shrink the wheel smoothly
      animate(sizeMotionValue, targetSize, { duration: 2.5, ease: 'easeInOut' })
      // After the wheel has settled, switch back to fast linear tracking
      const t = setTimeout(() => setIsTransitioning(false), 3000)
      return () => clearTimeout(t)
    }

    const timer = setTimeout(doAwaken, AWAKEN_TIMEOUT_MS)
    window.addEventListener('mousemove', doAwaken, { once: true })
    window.addEventListener('touchstart', doAwaken, { once: true })
    window.addEventListener('wheel', doAwaken, { once: true })
    window.addEventListener('scroll', doAwaken, { once: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', doAwaken)
      window.removeEventListener('touchstart', doAwaken)
      window.removeEventListener('wheel', doAwaken)
      window.removeEventListener('scroll', doAwaken)
    }
  }, [awakened, disabled, targetSize, sizeMotionValue])

  // ── Position ─────────────────────────────────────────────────────────────────
  // Hero mode: fixed at viewport center. Wandering mode: follow the strategy.
  // Guard against the strategy's {x:0, y:0} initial state — for the one render
  // cycle before the strategy effect runs, position is still zeroed; using it
  // would snap the wheel to the top-left corner and draw a jarring trace line.
  const strategyReady = position.x !== 0 || position.y !== 0
  const effectiveX = awakened && strategyReady ? position.x : viewportCenter.x
  const effectiveY = awakened && strategyReady ? position.y : viewportCenter.y

  const clampedX = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : renderSize
    const pad = renderSize / 2
    return Math.max(pad, Math.min(viewportWidth - pad, effectiveX))
  }, [effectiveX, renderSize])

  const clampedY = useMemo(() => {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : renderSize
    const pad = renderSize / 2
    return Math.max(pad, Math.min(viewportHeight - pad, effectiveY))
  }, [effectiveY, renderSize])

  // ── Trace canvas ─────────────────────────────────────────────────────────────
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
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (!awakened) return // don't draw trace in hero mode
    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const canvas = traceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = performance.now() / 1000
    const fadeWindow = 20
    const minSampleDistance = 2.5
    const minSampleInterval = 1 / 45
    const lastSample = samplesRef.current[samplesRef.current.length - 1]
    if (!lastSample) {
      samplesRef.current.push({ x: clampedX, y: clampedY, time: now })
    } else {
      const dx = clampedX - lastSample.x
      const dy = clampedY - lastSample.y
      const movedEnough = (dx * dx + dy * dy) >= (minSampleDistance * minSampleDistance)
      const waitedEnough = (now - lastSample.time) >= minSampleInterval
      if (movedEnough && waitedEnough) {
        samplesRef.current.push({ x: clampedX, y: clampedY, time: now })
      }
    }
    samplesRef.current = samplesRef.current.filter(s => now - s.time <= fadeWindow)

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    ctx.clearRect(0, 0, width, height)

    const samples = samplesRef.current
    if (samples.length < 2) return

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Split sample history into bands (oldest → newest). Each band is one
    // smooth quadratic-bezier path drawn in two passes: a wide soft glow and
    // a narrow sharp core. Width and alpha taper from fresh (near wheel) to old.
    const numBands = Math.max(1, Math.min(24, Math.floor(samples.length / 4)))

    for (let band = 0; band < numBands; band++) {
      const startIdx = Math.floor(band * samples.length / numBands)
      const endIdx = Math.min(samples.length - 1, Math.floor((band + 1) * samples.length / numBands))
      if (endIdx <= startIdx) continue

      const midSample = samples[Math.floor((startIdx + endIdx) / 2)]
      const age = now - midSample.time
      const t = Math.min(1, age / fadeWindow)
      const alpha = Math.exp(-3.5 * t)
      if (alpha < 0.01) continue

      const coreWidth = 0.35 + (1 - t) * 2.1

      // Build smooth path through the band using midpoint quadratic bezier.
      ctx.beginPath()
      const p0 = samples[startIdx]
      const p1 = samples[startIdx + 1] ?? p0
      if (endIdx - startIdx === 1) {
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
      } else {
        ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2)
        for (let i = startIdx + 1; i < endIdx; i++) {
          const si = samples[i]
          const sn = samples[i + 1]
          ctx.quadraticCurveTo(si.x, si.y, (si.x + sn.x) / 2, (si.y + sn.y) / 2)
        }
        ctx.lineTo(samples[endIdx].x, samples[endIdx].y)
      }

      // Glow pass — wide, additive, soft
      ctx.globalCompositeOperation = 'lighter'
      ctx.shadowBlur = coreWidth * 5
      ctx.shadowColor = `rgba(253, 224, 71, ${alpha * 0.4})`
      ctx.strokeStyle = `rgba(253, 224, 71, ${alpha * 0.18})`
      ctx.lineWidth = coreWidth * 3.5
      ctx.stroke()

      // Core pass — narrow, crisp
      ctx.globalCompositeOperation = 'source-over'
      ctx.shadowBlur = 0
      ctx.strokeStyle = `rgba(253, 224, 71, ${alpha * 0.82})`
      ctx.lineWidth = coreWidth
      ctx.stroke()
    }

    ctx.restore()
  }, [awakened, clampedX, clampedY])

  useEffect(() => {
    const canvas = traceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    samplesRef.current = []
  }, [profile.strategy.name, disabled])

  // ── Reduced motion ────────────────────────────────────────────────────────────
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Position transition ───────────────────────────────────────────────────────
  // Hero mode: no animation needed (fixed position).
  // Awakening: slow spring so the wheel gracefully drifts from center.
  // Settled wandering: fast linear (original behaviour).
  const positionTransition = !awakened
    ? { duration: 0 }
    : isTransitioning
      ? { type: 'spring', stiffness: 25, damping: 15 }
      : { type: 'tween', ease: 'linear', duration: 0.1 }

  if (!mounted) return null

  return (
    <>
      <canvas
        ref={traceCanvasRef}
        className="fixed top-0 left-0 pointer-events-none select-none"
        style={{ zIndex: 15, opacity: 0.92 }}
      />
      <motion.div
        id="dharma-wheel"
        data-vaithya-role="wheel"
        className="fixed pointer-events-none select-none"
        style={{
          left: clampedX - renderSize / 2,
          top: clampedY - renderSize / 2,
          zIndex: 16,
          opacity: prefersReducedMotion ? 0.1 : wheelOpacity
        }}
        animate={{
          left: clampedX - renderSize / 2,
          top: clampedY - renderSize / 2,
        }}
        transition={positionTransition}
      >
        {/* Float wrapper — only active in hero mode */}
        <motion.div
          animate={!awakened ? { y: [0, -10, 0] } : { y: 0 }}
          transition={
            !awakened
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.6, ease: 'easeOut' }
          }
        >
          <DharmaWheel
            size={renderSize}
            className={`transition-opacity duration-500 ${disabled ? 'opacity-20' : ''}`}
          />
        </motion.div>

        {/* Subtle ambient glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
            filter: 'blur(2px)'
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.05, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </>
  )
}
