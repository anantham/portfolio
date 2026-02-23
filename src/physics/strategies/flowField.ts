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
  minTurnRate?: number
  turnPersistence?: number
  turnJitter?: number
  turnCentering?: number
  orbitBlend?: number
  orbitCenterX?: number
  orbitCenterY?: number
  orbitRadius?: number
  orbitMinRadius?: number
  orbitRadiusDriftAmp?: number
  orbitRadiusDriftHz?: number
  orbitBuildUpAmp?: number
  orbitBuildUpPeriod?: number
  orbitRadialGain?: number
  orbitTangentialSpeed?: number
  orbitDirection?: -1 | 1
}

interface FlowState {
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  time: number
  turnSign: -1 | 1
  orbitPhase: number
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
    turnSign: random.next() < 0.5 ? -1 : 1,
    orbitPhase: random.next() * Math.PI * 2,
    random
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const limitAngleDelta = (delta: number) => {
    let d = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI
    if (d < -Math.PI) d += Math.PI * 2
    return d
  }

  const wallForce = (distance: number, pad: number, k: number) => {
    const delta = pad - distance
    if (delta <= 0) return 0
    return k / ((delta * delta) + 1)
  }

  const reset = (env: MotionEnvironment) => {
    state.time = 0
    const startPad = Math.max(config.pad, 0)
    state.position.x = startPad
    state.position.y = startPad
    const dx = env.width * 0.5 - state.position.x
    const dy = env.height * 0.5 - state.position.y
    const angle = Math.atan2(dy, dx)
    const speed = config.baseSpeed
    state.velocity.x = Math.cos(angle) * speed
    state.velocity.y = Math.sin(angle) * speed
    state.turnSign = config.orbitDirection ?? (state.random.next() < 0.5 ? -1 : 1)
  }

  const resolveOrbitVector = (env: MotionEnvironment) => {
    const orbitBlend = clamp(config.orbitBlend ?? 0, 0, 1)
    const turnCentering = Math.max(config.turnCentering ?? 0, 0)

    if (orbitBlend === 0 && turnCentering === 0) {
      return null
    }

    const centerX = env.width * (config.orbitCenterX ?? 0.5)
    const centerY = env.height * (config.orbitCenterY ?? 0.5)
    const dx = state.position.x - centerX
    const dy = state.position.y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    const speed = Math.sqrt(state.velocity.x * state.velocity.x + state.velocity.y * state.velocity.y)
    const fallbackHeading = speed > 0.001 ? Math.atan2(state.velocity.y, state.velocity.x) : state.random.next() * Math.PI * 2
    const ux = distance > 0.001 ? dx / distance : Math.cos(fallbackHeading)
    const uy = distance > 0.001 ? dy / distance : Math.sin(fallbackHeading)

    const orbitDirection = config.orbitDirection ?? state.turnSign
    const tangentX = orbitDirection >= 0 ? -uy : uy
    const tangentY = orbitDirection >= 0 ? ux : -ux

    const baseRadius = config.orbitRadius ?? Math.min(env.width, env.height) * 0.3
    const orbitMinRadius = Math.max(config.orbitMinRadius ?? 48, 48)
    const radiusDriftAmp = config.orbitRadiusDriftAmp ?? 0
    const radiusDriftHz = config.orbitRadiusDriftHz ?? 0
    const buildUpAmp = Math.max(config.orbitBuildUpAmp ?? 0, 0)
    const buildUpPeriod = Math.max(config.orbitBuildUpPeriod ?? 0, 0)
    const buildUpPhase = buildUpPeriod > 0 ? ((state.time % buildUpPeriod) / buildUpPeriod) : 0
    const buildUpRadius = buildUpAmp * buildUpPhase
    const radius = Math.max(
      orbitMinRadius,
      baseRadius
        + radiusDriftAmp * Math.sin(2 * Math.PI * radiusDriftHz * state.time + state.orbitPhase)
        + buildUpRadius
    )
    const radialError = distance - radius
    const radialGain = config.orbitRadialGain ?? 0.2
    const tangentialSpeed = config.orbitTangentialSpeed ?? config.baseSpeed

    return {
      blend: orbitBlend,
      tangentHeading: Math.atan2(tangentY, tangentX),
      velocity: {
        x: -radialGain * radialError * ux + tangentialSpeed * tangentX,
        y: -radialGain * radialError * uy + tangentialSpeed * tangentY
      }
    }
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

    const orbit = resolveOrbitVector(env)
    if (orbit && orbit.blend > 0) {
      desiredVel.x = desiredVel.x * (1 - orbit.blend) + orbit.velocity.x * orbit.blend
      desiredVel.y = desiredVel.y * (1 - orbit.blend) + orbit.velocity.y * orbit.blend
    }

    const minTurnRate = Math.max(config.minTurnRate ?? 0, 0)
    const turnPersistence = Math.max(config.turnPersistence ?? 12, 0.1)
    if (minTurnRate > 0 && state.random.next() < dt / turnPersistence) {
      state.turnSign = state.turnSign === 1 ? -1 : 1
    }

    const speedBeforeTurn = Math.sqrt(desiredVel.x * desiredVel.x + desiredVel.y * desiredVel.y) || config.baseSpeed
    const signedTurn = (config.orbitDirection ?? state.turnSign) * minTurnRate
    const jitterTurn = (config.turnJitter ?? 0) * state.random.gaussian()
    let desiredHeading = Math.atan2(desiredVel.y, desiredVel.x) + (signedTurn + jitterTurn) * dt

    if (orbit) {
      const centeringRate = Math.max(config.turnCentering ?? 0, 0)
      const correction = clamp(limitAngleDelta(orbit.tangentHeading - desiredHeading), -centeringRate * dt, centeringRate * dt)
      desiredHeading += correction
    }

    desiredVel.x = Math.cos(desiredHeading) * speedBeforeTurn
    desiredVel.y = Math.sin(desiredHeading) * speedBeforeTurn

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
