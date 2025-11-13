import { createRandomSource } from '../random'
import type { MotionEnvironment, StrategyFactory, StrategyRunner, StrategyUpdateResult } from '../types'

export interface ZenConfig {
  baseSpeed: number
  maxTurnRate: number
  ema: number
  pad: number
  wallK: number
  tau: number
  sigma: number
  breatheAmp: number
  breatheHz: number
  pauseProbability: number
  pauseDuration: { min: number; max: number }
  flowStrength: number
  flowScale: number
  flowTimeScale: number
  mouseAvoidanceRadius: number
  mouseAvoidanceStrength: number
  mouseCollisionRadius?: number
  mouseCollisionDamping?: number
  seed?: number
}

interface ZenState {
  time: number
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  heading: number
  driftVelocity: number
  pausedUntil: number
  random: ReturnType<typeof createRandomSource>
}

export const createZenStrategy: StrategyFactory<ZenConfig> = (config, options) => {
  const random = createRandomSource(options.seed)

  const state: ZenState = {
    time: 0,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    heading: random.next() * Math.PI * 2,
    driftVelocity: 0,
    pausedUntil: 0,
    random
  }

  const softReset = (env: MotionEnvironment) => {
    state.time = 0
    state.position.x = env.width * 0.5
    state.position.y = env.height * 0.5
    const angle = random.next() * Math.PI * 2
    state.heading = angle
    const speed = config.baseSpeed
    state.velocity.x = Math.cos(angle) * speed
    state.velocity.y = Math.sin(angle) * speed
    state.driftVelocity = 0
    state.pausedUntil = 0
  }

  const initialise = (env: MotionEnvironment) => {
    softReset(env)
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const wallForce = (distance: number, pad: number, k: number) => {
    const delta = pad - distance
    if (delta <= 0) return 0
    return k / ((delta * delta) + 1)
  }

  const flow = (x: number, y: number, t: number) => {
    const scale = config.flowScale
    const timeScale = config.flowTimeScale
    const f = (n: number) => Math.sin(n) * Math.cos(n * 0.7)
    const strength = config.flowStrength
    return {
      x: strength * f(x * scale + t * timeScale * 0.1 + 13.37),
      y: strength * f(y * scale - t * timeScale * 0.07 + 42.42)
    }
  }

  const limitAngleDelta = (delta: number) => {
    let d = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI
    if (d < -Math.PI) d += Math.PI * 2
    return d
  }

  const step = (env: MotionEnvironment): StrategyUpdateResult => {
    const dt = clamp(env.deltaTime, 0.001, 0.033)
    state.time += dt

    const { width, height } = env

    if (state.time > state.pausedUntil && state.random.next() < config.pauseProbability * dt) {
      const pauseWindow = config.pauseDuration.max - config.pauseDuration.min
      state.pausedUntil = state.time + config.pauseDuration.min + state.random.next() * (pauseWindow > 0 ? pauseWindow : 0)
    }

    const paused = state.time < state.pausedUntil

    // Ornstein–Uhlenbeck process on drift velocity controlling heading changes
    const relaxation = dt / Math.max(config.tau, 0.001)
    state.driftVelocity += -state.driftVelocity * relaxation + config.sigma * Math.sqrt(dt) * state.random.gaussian()
    const targetHeading = state.heading + state.driftVelocity * dt

    const desiredDelta = limitAngleDelta(targetHeading - state.heading)
    const maxDelta = config.maxTurnRate * dt
    state.heading += clamp(desiredDelta, -maxDelta, maxDelta)

    const breathe = 1 + config.breatheAmp * Math.cos(2 * Math.PI * config.breatheHz * state.time)
    const targetSpeed = config.baseSpeed * breathe

    const dir = { x: Math.cos(state.heading), y: Math.sin(state.heading) }
    let desiredVel = {
      x: dir.x * targetSpeed,
      y: dir.y * targetSpeed
    }

    // Soft walls
    if (config.pad > 0) {
      const left = wallForce(state.position.x, config.pad, config.wallK)
      const right = -wallForce(width - state.position.x, config.pad, config.wallK)
      const top = wallForce(state.position.y, config.pad, config.wallK)
      const bottom = -wallForce(height - state.position.y, config.pad, config.wallK)

      desiredVel.x += left + right
      desiredVel.y += top + bottom
    }

    // Flow field guidance
    const flowVec = flow(state.position.x, state.position.y, state.time)
    desiredVel.x += flowVec.x
    desiredVel.y += flowVec.y

    // Mouse avoidance (gentle)
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

    // Low-pass filter on velocity
    state.velocity.x = state.velocity.x + (desiredVel.x - state.velocity.x) * config.ema
    state.velocity.y = state.velocity.y + (desiredVel.y - state.velocity.y) * config.ema

    if (paused) {
      state.velocity.x *= 0.88
      state.velocity.y *= 0.88
    }

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
        state.heading = Math.atan2(state.velocity.y, state.velocity.x)
      }
    }

    // fallback reflective boundaries
    if (state.position.x < config.pad) {
      state.position.x = config.pad
      state.velocity.x *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }
    if (state.position.x > width - config.pad) {
      state.position.x = width - config.pad
      state.velocity.x *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }
    if (state.position.y < config.pad) {
      state.position.y = config.pad
      state.velocity.y *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }
    if (state.position.y > height - config.pad) {
      state.position.y = height - config.pad
      state.velocity.y *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }

    return {
      position: { ...state.position },
      velocity: { ...state.velocity },
      heading: state.heading
    }
  }

  const runner: StrategyRunner = {
    step,
    reset: initialise
  }

  return runner
}
