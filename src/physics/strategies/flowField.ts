import { createRandomSource } from '../random'
import type { MotionEnvironment, StrategyFactory, StrategyRunner, StrategyUpdateResult } from '../types'

export interface FlowFieldConfig {
  baseSpeed: number
  curlStrength: number
  noiseScale: number
  noiseTimeScale: number
  smoothing: number
  pad: number
  wallK: number
  mouseAvoidanceRadius: number
  mouseAvoidanceStrength: number
  mouseCollisionRadius?: number
  mouseCollisionDamping?: number
  seed?: number
}

interface FlowState {
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  time: number
  random: ReturnType<typeof createRandomSource>
}

const pseudoNoise = (x: number, y: number, t: number) => {
  return Math.sin(x + t * 0.1) * Math.cos(y * 0.7 - t * 0.05)
}

const curl = (x: number, y: number, t: number, scale: number) => {
  const eps = 0.0001
  const nx = x * scale
  const ny = y * scale

  const a = pseudoNoise(nx, ny + eps, t)
  const b = pseudoNoise(nx, ny - eps, t)
  const c = pseudoNoise(nx + eps, ny, t)
  const d = pseudoNoise(nx - eps, ny, t)

  const curlX = (a - b) / (2 * eps)
  const curlY = (d - c) / (2 * eps)

  return { x: curlX, y: curlY }
}

export const createFlowFieldStrategy: StrategyFactory<FlowFieldConfig> = (config, options) => {
  const random = createRandomSource(options.seed)

  const state: FlowState = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    time: 0,
    random
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const wallForce = (distance: number, pad: number, k: number) => {
    const delta = pad - distance
    if (delta <= 0) return 0
    return k / ((delta * delta) + 1)
  }

  const reset = (env: MotionEnvironment) => {
    state.time = 0
    state.position.x = env.width * 0.5
    state.position.y = env.height * 0.5
    const angle = random.next() * Math.PI * 2
    const speed = config.baseSpeed
    state.velocity.x = Math.cos(angle) * speed
    state.velocity.y = Math.sin(angle) * speed
  }

  const step = (env: MotionEnvironment): StrategyUpdateResult => {
    const dt = clamp(env.deltaTime, 0.001, 0.033)
    state.time += dt

    const { width, height } = env

    const flow = curl(state.position.x, state.position.y, state.time * config.noiseTimeScale, config.noiseScale)
    const flowStrength = config.curlStrength

    let desiredVel = {
      x: flow.x * flowStrength + state.velocity.x,
      y: flow.y * flowStrength + state.velocity.y
    }

    const speed = Math.sqrt(desiredVel.x * desiredVel.x + desiredVel.y * desiredVel.y) || 1
    const targetSpeed = config.baseSpeed
    desiredVel.x = (desiredVel.x / speed) * targetSpeed
    desiredVel.y = (desiredVel.y / speed) * targetSpeed

    // Soft walls
    if (config.pad > 0) {
      const left = wallForce(state.position.x, config.pad, config.wallK)
      const right = -wallForce(width - state.position.x, config.pad, config.wallK)
      const top = wallForce(state.position.y, config.pad, config.wallK)
      const bottom = -wallForce(height - state.position.y, config.pad, config.wallK)

      desiredVel.x += left + right
      desiredVel.y += top + bottom
    }

    // Mouse avoidance
    if (env.mouse) {
      const dx = state.position.x - env.mouse.x
      const dy = state.position.y - env.mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 0 && distance < config.mouseAvoidanceRadius) {
        const strength = config.mouseAvoidanceStrength * (1 - distance / config.mouseAvoidanceRadius)
        desiredVel.x += (dx / distance) * strength
        desiredVel.y += (dy / distance) * strength
      }
    }

    const alpha = clamp(config.smoothing, 0, 1)
    state.velocity.x = state.velocity.x + (desiredVel.x - state.velocity.x) * (1 - alpha)
    state.velocity.y = state.velocity.y + (desiredVel.y - state.velocity.y) * (1 - alpha)

    state.position.x += state.velocity.x * dt
    state.position.y += state.velocity.y * dt

    if (env.mouse) {
      const collisionRadius = config.mouseCollisionRadius ?? config.mouseAvoidanceRadius
      const damping = config.mouseCollisionDamping ?? 0.6
      const dx = state.position.x - env.mouse.x
      const dy = state.position.y - env.mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 0 && distance < collisionRadius) {
        const nx = dx / distance
        const ny = dy / distance
        state.position.x = env.mouse.x + nx * collisionRadius
        state.position.y = env.mouse.y + ny * collisionRadius
        const dot = state.velocity.x * nx + state.velocity.y * ny
        state.velocity.x = (state.velocity.x - 2 * dot * nx) * damping
        state.velocity.y = (state.velocity.y - 2 * dot * ny) * damping
      }
    }

    // fallback boundaries
    if (state.position.x < config.pad) {
      state.position.x = config.pad
      state.velocity.x *= -0.7
    }
    if (state.position.x > width - config.pad) {
      state.position.x = width - config.pad
      state.velocity.x *= -0.7
    }
    if (state.position.y < config.pad) {
      state.position.y = config.pad
      state.velocity.y *= -0.7
    }
    if (state.position.y > height - config.pad) {
      state.position.y = height - config.pad
      state.velocity.y *= -0.7
    }

    return {
      position: { ...state.position },
      velocity: { ...state.velocity }
    }
  }

  const runner: StrategyRunner = {
    step,
    reset
  }

  return runner
}
