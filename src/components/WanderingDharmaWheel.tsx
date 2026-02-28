'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useMotionStrategy } from '@/hooks/useMotionStrategy'
import { getWheelMotionProfile } from '@/lib/content'
import { useLens } from '@/contexts/LensContext'
import { useOrientation } from '@/contexts/OrientationContext'
import DharmaWheel from '@/components/DharmaWheel'

const HERO_SIZE = 160
const AWAKEN_TIMEOUT_MS = 10000
const SLOW_APPROACH_UNLOCK_SECONDS = 4
const SLOW_APPROACH_SPEED_THRESHOLD = 80
const UNLOCK_STORAGE_KEY = 'dharma-wheel-unlocked-v1'

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
  const router = useRouter()
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
  const [unlockProgress, setUnlockProgress] = useState(0)
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false)

  // ── Awakening state (declared early so strategy can use it) ──────────────────
  const [awakened, setAwakened] = useState(false)
  // True for ~3s after awakening so we use a slow spring for the initial drift
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Animated size: starts at HERO_SIZE, shrinks to targetSize on awakening
  const sizeMotionValue = useMotionValue(HERO_SIZE)
  const [renderSize, setRenderSize] = useState(HERO_SIZE)
  // Runtime refs for trace diagnostics and unlock logic
  const traceCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const samplesRef = useRef<Array<{ x: number; y: number; time: number }>>([])
  const unlockRafRef = useRef<number | null>(null)
  const wheelCenterRef = useRef({ x: 0, y: 0 })
  const mouseRef = useRef({ x: 0, y: 0 })
  const mouseSpeedRef = useRef(0)
  const lastMouseSampleRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const renderSizeRef = useRef(HERO_SIZE)
  const traceDebugRef = useRef<Record<string, unknown>>({})
  const runtimeDebugRef = useRef<Record<string, unknown>>({})

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

  useEffect(() => {
    if (!mounted) return
    try {
      const stored = window.localStorage.getItem(UNLOCK_STORAGE_KEY)
      if (stored === '1') {
        setEasterEggUnlocked(true)
        setUnlockProgress(1)
      }
    } catch {
      // Ignore storage access failures in strict privacy contexts.
    }
  }, [mounted])

  useEffect(() => {
    wheelCenterRef.current = { x: clampedX, y: clampedY }
    renderSizeRef.current = renderSize
  }, [clampedX, clampedY, renderSize])

  useEffect(() => {
    const now = performance.now()
    const previous = lastMouseSampleRef.current
    if (!previous) {
      lastMouseSampleRef.current = { x: mousePosition.x, y: mousePosition.y, t: now }
      mouseRef.current = { x: mousePosition.x, y: mousePosition.y }
      mouseSpeedRef.current = 0
      return
    }

    const dt = Math.max(0.001, (now - previous.t) / 1000)
    const dx = mousePosition.x - previous.x
    const dy = mousePosition.y - previous.y
    const instantSpeed = Math.sqrt(dx * dx + dy * dy) / dt
    const smoothing = 0.25
    mouseSpeedRef.current += (instantSpeed - mouseSpeedRef.current) * smoothing

    mouseRef.current = { x: mousePosition.x, y: mousePosition.y }
    lastMouseSampleRef.current = { x: mousePosition.x, y: mousePosition.y, t: now }
  }, [mousePosition.x, mousePosition.y])

  useEffect(() => {
    if (!mounted || disabled) return

    let lastTs = performance.now()
    const step = (ts: number) => {
      const dt = Math.max(0.001, (ts - lastTs) / 1000)
      lastTs = ts

      if (!awakened || easterEggUnlocked) {
        unlockRafRef.current = requestAnimationFrame(step)
        return
      }

      // Decay mouse speed toward 0 when cursor is stationary (no mousemove events fire).
      // Without this, mouseSpeedRef stays frozen at the last measured speed forever.
      mouseSpeedRef.current *= Math.pow(0.05, dt)

      const center = wheelCenterRef.current
      const mouse = mouseRef.current
      const speed = mouseSpeedRef.current
      const wheelSize = renderSizeRef.current

      const dx = mouse.x - center.x
      const dy = mouse.y - center.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const nearRadius = wheelSize * 3.0
      const contactRadius = wheelSize * 0.58

      const nearFactor = Math.max(0, Math.min(1, 1 - distance / nearRadius))
      const slowFactor = Math.max(0, Math.min(1, 1 - speed / SLOW_APPROACH_SPEED_THRESHOLD))
      const touchBonus = distance <= contactRadius ? 0.35 : 0

      const growth = (nearFactor * slowFactor + touchBonus) / SLOW_APPROACH_UNLOCK_SECONDS
      const decayRate = distance > nearRadius || speed > SLOW_APPROACH_SPEED_THRESHOLD
        ? 0.32
        : 0.05

      setUnlockProgress((prev) => {
        const next = Math.max(0, Math.min(1, prev + growth * dt - decayRate * dt))
        if (next >= 1 && !easterEggUnlocked) {
          setEasterEggUnlocked(true)
          try {
            window.localStorage.setItem(UNLOCK_STORAGE_KEY, '1')
          } catch {
            // Ignore storage access failures.
          }
        }
        return next
      })

      unlockRafRef.current = requestAnimationFrame(step)
    }

    unlockRafRef.current = requestAnimationFrame(step)
    return () => {
      if (unlockRafRef.current !== null) {
        cancelAnimationFrame(unlockRafRef.current)
      }
      unlockRafRef.current = null
    }
  }, [awakened, disabled, easterEggUnlocked, mounted])

  useEffect(() => {
    runtimeDebugRef.current = {
      awakened,
      disabled,
      strategy: profile.strategy.name,
      lens: selectedLens ?? 'none',
      orientation: activeCategory ?? 'none',
      unlockProgress: Number(unlockProgress.toFixed(3)),
      easterEggUnlocked,
      wheelX: clampedX,
      wheelY: clampedY,
      wheelSize: renderSize,
      mouseX: mouseRef.current.x,
      mouseY: mouseRef.current.y,
      mouseSpeed: Math.round(mouseSpeedRef.current),
    }
  }, [
    activeCategory,
    awakened,
    clampedX,
    clampedY,
    disabled,
    easterEggUnlocked,
    profile.strategy.name,
    renderSize,
    selectedLens,
    unlockProgress,
  ])

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
    if (!awakened) {
      traceDebugRef.current = {
        phase: 'trace',
        reason: 'not-awakened',
        awakened,
        disabled,
        strategy: profile.strategy.name,
      }
      return
    }
    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      traceDebugRef.current = {
        phase: 'trace',
        reason: 'reduced-motion',
        awakened,
        disabled,
        strategy: profile.strategy.name,
      }
      return
    }

    const canvas = traceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = performance.now() / 1000
    const fadeWindow = 45
    const minSampleDistance = 0.8
    const minSampleInterval = 1 / 75
    const lastSample = samplesRef.current[samplesRef.current.length - 1]
    let movedEnough = false
    let waitedEnough = false
    let sampleAdded = false
    let distanceFromLast = 0
    let timeSinceLast = 0
    if (!lastSample) {
      samplesRef.current.push({ x: clampedX, y: clampedY, time: now })
      sampleAdded = true
    } else {
      const dx = clampedX - lastSample.x
      const dy = clampedY - lastSample.y
      distanceFromLast = Math.sqrt(dx * dx + dy * dy)
      timeSinceLast = now - lastSample.time
      movedEnough = (dx * dx + dy * dy) >= (minSampleDistance * minSampleDistance)
      waitedEnough = (now - lastSample.time) >= minSampleInterval
      if (movedEnough && waitedEnough) {
        samplesRef.current.push({ x: clampedX, y: clampedY, time: now })
        sampleAdded = true
      }
    }
    samplesRef.current = samplesRef.current.filter(s => now - s.time <= fadeWindow)

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    ctx.clearRect(0, 0, width, height)

    const samples = samplesRef.current
    if (samples.length < 2) {
      traceDebugRef.current = {
        phase: 'trace',
        reason: 'insufficient-samples',
        now,
        awakened,
        disabled,
        strategy: profile.strategy.name,
        sampleCount: samples.length,
        sampleAdded,
        movedEnough,
        waitedEnough,
        distanceFromLast,
        timeSinceLast,
        mouseSpeed: mouseSpeedRef.current,
        wheelX: clampedX,
        wheelY: clampedY,
      }
      return
    }

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // Build one continuous smoothed path over the full history window.
    ctx.beginPath()
    const first = samples[0]
    const second = samples[1] ?? first
    if (samples.length === 2) {
      ctx.moveTo(first.x, first.y)
      ctx.lineTo(second.x, second.y)
    } else {
      ctx.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2)
      for (let index = 1; index < samples.length - 1; index += 1) {
        const sample = samples[index]
        const next = samples[index + 1]
        ctx.quadraticCurveTo(sample.x, sample.y, (sample.x + next.x) / 2, (sample.y + next.y) / 2)
      }
      const tail = samples[samples.length - 1]
      ctx.lineTo(tail.x, tail.y)
    }

    // Thin soft body.
    ctx.globalCompositeOperation = 'source-over'
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Very thin brighter core.
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.26)'
    ctx.lineWidth = 0.45
    ctx.stroke()

    // Subtle end-cap sparkle near the wheel for a "stardust" feel.
    const tail = samples[samples.length - 1]
    ctx.beginPath()
    ctx.arc(tail.x, tail.y, 1.1, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(253, 224, 71, 0.35)'
    ctx.fill()

    ctx.restore()

    traceDebugRef.current = {
      phase: 'trace',
      reason: 'drawn',
      now,
      awakened,
      disabled,
      strategy: profile.strategy.name,
      sampleCount: samples.length,
      sampleAdded,
      movedEnough,
      waitedEnough,
      distanceFromLast,
      timeSinceLast,
      mouseSpeed: mouseSpeedRef.current,
      wheelX: clampedX,
      wheelY: clampedY,
    }
  }, [awakened, clampedX, clampedY, disabled, profile.strategy.name])

  useEffect(() => {
    const canvas = traceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    samplesRef.current = []
    traceDebugRef.current = {
      phase: 'trace',
      reason: 'reset',
      strategy: profile.strategy.name,
      disabled,
      sampleCount: 0,
    }
  }, [profile.strategy.name, disabled])

  useEffect(() => {
    if (!mounted || process.env.NODE_ENV !== 'development') return

    const debug = {
      awakened,
      disabled,
      strategy: profile.strategy.name,
      samples: samplesRef.current.length,
      wheel: { x: clampedX, y: clampedY, size: renderSize },
      mouse: {
        x: mouseRef.current.x,
        y: mouseRef.current.y,
        speed: Math.round(mouseSpeedRef.current),
      },
      unlockProgress: Number(unlockProgress.toFixed(3)),
      easterEggUnlocked,
      clickable: easterEggUnlocked && !disabled,
    }

    ;(window as any).__dharmaWheelDebug = debug
  }, [
    awakened,
    clampedX,
    clampedY,
    disabled,
    easterEggUnlocked,
    mounted,
    profile.strategy.name,
    renderSize,
    unlockProgress,
  ])

  useEffect(() => {
    if (!mounted || process.env.NODE_ENV !== 'development') return

    const logSnapshot = () => {
      const payload = {
        kind: 'snapshot',
        ts: new Date().toISOString(),
        runtime: runtimeDebugRef.current,
        trace: traceDebugRef.current,
      }

      void fetch('/api/diagnostics/wheel-trace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Best-effort diagnostics; no user-visible errors.
      })
    }

    const id = window.setInterval(logSnapshot, 1000)
    return () => window.clearInterval(id)
  }, [mounted])

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
        style={{ zIndex: 15, opacity: 0.72 }}
      />
      <motion.div
        id="dharma-wheel"
        data-vaithya-role="wheel"
        className={`fixed select-none ${easterEggUnlocked && !disabled ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
        style={{
          left: clampedX - renderSize / 2,
          top: clampedY - renderSize / 2,
          zIndex: 16,
          opacity: prefersReducedMotion ? 0.1 : wheelOpacity
        }}
        role={easterEggUnlocked && !disabled ? 'button' : undefined}
        tabIndex={easterEggUnlocked && !disabled ? 0 : -1}
        aria-label={easterEggUnlocked ? 'Open Dhamma wheel' : 'Dharma wheel'}
        animate={{
          left: clampedX - renderSize / 2,
          top: clampedY - renderSize / 2,
        }}
        transition={positionTransition}
        onClick={() => {
          if (!easterEggUnlocked || disabled) return
          router.push('/dhamma')
        }}
        onKeyDown={(event) => {
          if (!easterEggUnlocked || disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            router.push('/dhamma')
          }
        }}
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

        {/* Unlock progress glow — swells as you hold a slow approach, invisible otherwise */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-30%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.55) 0%, rgba(251, 191, 36, 0.15) 45%, transparent 70%)',
            filter: 'blur(12px)',
            opacity: unlockProgress * 0.8,
            transition: 'opacity 1.4s ease-out',
          }}
        />
      </motion.div>
    </>
  )
}
