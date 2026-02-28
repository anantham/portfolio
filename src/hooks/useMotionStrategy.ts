'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Position } from '@/physics/types'
import { getStrategyFactory } from '@/physics/registry'
import type { MotionEnvironment, StrategyRunner } from '@/physics/types'

interface UseMotionStrategyOptions<TConfig = Record<string, unknown>> {
  strategyType: string
  config: TConfig
  seed?: number
  mousePosition?: Position | null
  disabled?: boolean
}

export function useMotionStrategy<TConfig = Record<string, unknown>>({
  strategyType,
  config,
  seed,
  mousePosition,
  disabled
}: UseMotionStrategyOptions<TConfig>) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })

  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 })

  const runnerRef = useRef<StrategyRunner | null>(null)
  const timeRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const mouseRef = useRef<Position | null>(mousePosition ?? null)
  const mouseVelocityRef = useRef<Position | null>(null)
  const lastMouseSampleRef = useRef<{ x: number; y: number; t: number } | null>(null)
  // Track live position so new runners can start from current location
  const livePositionRef = useRef<Position>({ x: 0, y: 0 })

  useEffect(() => {
    if (!mousePosition) {
      mouseRef.current = null
      mouseVelocityRef.current = null
      lastMouseSampleRef.current = null
      return
    }

    const now = performance.now()
    const previous = lastMouseSampleRef.current
    if (!previous) {
      mouseVelocityRef.current = { x: 0, y: 0 }
      lastMouseSampleRef.current = { x: mousePosition.x, y: mousePosition.y, t: now }
      mouseRef.current = mousePosition
      return
    }

    const dt = Math.max(0.001, (now - previous.t) / 1000)
    const rawVx = (mousePosition.x - previous.x) / dt
    const rawVy = (mousePosition.y - previous.y) / dt
    const maxVelocity = 4000
    const clampedVx = Math.max(-maxVelocity, Math.min(maxVelocity, rawVx))
    const clampedVy = Math.max(-maxVelocity, Math.min(maxVelocity, rawVy))

    const previousVelocity = mouseVelocityRef.current ?? { x: 0, y: 0 }
    const smoothing = 0.35
    mouseVelocityRef.current = {
      x: previousVelocity.x + (clampedVx - previousVelocity.x) * smoothing,
      y: previousVelocity.y + (clampedVy - previousVelocity.y) * smoothing,
    }

    lastMouseSampleRef.current = { x: mousePosition.x, y: mousePosition.y, t: now }
    mouseRef.current = mousePosition
  }, [mousePosition])

  const factory = useMemo(() => getStrategyFactory(strategyType), [strategyType])

  useEffect(() => {
    if (!factory || disabled) {
      runnerRef.current = null
      return
    }

    // Seed new runner from current live position so there's no teleport on config change
    const currentPos = livePositionRef.current
    const seededConfig = (currentPos.x !== 0 || currentPos.y !== 0)
      ? { ...config as Record<string, unknown>, initialX: currentPos.x, initialY: currentPos.y }
      : config

    const runner = factory(seededConfig, { seed })
    runnerRef.current = runner
    timeRef.current = 0
    lastTimestampRef.current = null

    const startEnv: MotionEnvironment = {
      width: window.innerWidth,
      height: window.innerHeight,
      time: 0,
      deltaTime: 0,
      mouse: mouseRef.current,
      mouseVelocity: mouseVelocityRef.current,
    }

    runner.reset(startEnv)

    const result = runner.step({ ...startEnv, deltaTime: 0 })
    livePositionRef.current = result.position
    setPosition(result.position)
    setVelocity(result.velocity)

    return () => {
      runnerRef.current = null
    }
  }, [factory, config, seed, disabled])

  useEffect(() => {
    if (!factory || disabled) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    const step = (timestamp: number) => {
      if (!runnerRef.current) {
        frameRef.current = requestAnimationFrame(step)
        return
      }

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }

      const delta = (timestamp - (lastTimestampRef.current ?? timestamp)) / 1000
      lastTimestampRef.current = timestamp
      timeRef.current += delta

      const env: MotionEnvironment = {
        width: window.innerWidth,
        height: window.innerHeight,
        time: timeRef.current,
        deltaTime: delta,
        mouse: mouseRef.current,
        mouseVelocity: mouseVelocityRef.current,
      }

      const result = runnerRef.current.step(env)
      livePositionRef.current = result.position
      setPosition(result.position)
      setVelocity(result.velocity)

      frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      frameRef.current = null
    }
  }, [factory, disabled])

  return { position, velocity }
}
