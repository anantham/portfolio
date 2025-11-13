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

  useEffect(() => {
    mouseRef.current = mousePosition ?? null
  }, [mousePosition])

  const factory = useMemo(() => getStrategyFactory(strategyType), [strategyType])

  useEffect(() => {
    if (!factory || disabled) {
      runnerRef.current = null
      return
    }

    const runner = factory(config, { seed })
    runnerRef.current = runner
    timeRef.current = 0
    lastTimestampRef.current = null

    const startEnv: MotionEnvironment = {
      width: window.innerWidth,
      height: window.innerHeight,
      time: 0,
      deltaTime: 0,
      mouse: mouseRef.current
    }

    runner.reset(startEnv)

    const result = runner.step({ ...startEnv, deltaTime: 0 })
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
        mouse: mouseRef.current
      }

      const result = runnerRef.current.step(env)
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
