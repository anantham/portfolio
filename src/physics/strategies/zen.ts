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
  initialX?: number
  initialY?: number
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

interface ZenState {
  time: number
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  heading: number
  driftVelocity: number
  turnSign: -1 | 1
  orbitPhase: number
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
    turnSign: random.next() < 0.5 ? -1 : 1,
    orbitPhase: random.next() * Math.PI * 2,
    pausedUntil: 0,
    random
  }

  const softReset = (env: MotionEnvironment) => {
    state.time = 0
    const startPad = Math.max(config.pad, 0)
    state.position.x = config.initialX ?? startPad
    state.position.y = config.initialY ?? startPad
    const dx = env.width * 0.5 - state.position.x
    const dy = env.height * 0.5 - state.position.y
    const angle = Math.atan2(dy, dx)
    state.heading = angle
    const speed = config.baseSpeed
    state.velocity.x = Math.cos(angle) * speed
    state.velocity.y = Math.sin(angle) * speed
    state.driftVelocity = 0
    state.turnSign = config.orbitDirection ?? (state.random.next() < 0.5 ? -1 : 1)
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

    const ux = distance > 0.001 ? dx / distance : Math.cos(state.heading)
    const uy = distance > 0.001 ? dy / distance : Math.sin(state.heading)

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

    if (state.time > state.pausedUntil && state.random.next() < config.pauseProbability * dt) {
      const pauseWindow = config.pauseDuration.max - config.pauseDuration.min
      state.pausedUntil = state.time + config.pauseDuration.min + state.random.next() * (pauseWindow > 0 ? pauseWindow : 0)
    }

    const paused = state.time < state.pausedUntil

    const orbit = resolveOrbitVector(env)
    const minTurnRate = Math.max(config.minTurnRate ?? 0, 0)
    const turnPersistence = Math.max(config.turnPersistence ?? 12, 0.1)

    if (minTurnRate > 0 && state.random.next() < dt / turnPersistence) {
      state.turnSign = state.turnSign === 1 ? -1 : 1
    }

    // Ornstein–Uhlenbeck process on drift velocity controlling heading changes
    const relaxation = dt / Math.max(config.tau, 0.001)
    state.driftVelocity += -state.driftVelocity * relaxation + config.sigma * Math.sqrt(dt) * state.random.gaussian()
    const signedTurn = (config.orbitDirection ?? state.turnSign) * minTurnRate
    const turnJitter = (config.turnJitter ?? 0) * state.random.gaussian()
    const targetHeading = state.heading + (state.driftVelocity + signedTurn + turnJitter) * dt

    let desiredDelta = limitAngleDelta(targetHeading - state.heading)
    if (orbit) {
      const centeringRate = Math.max(config.turnCentering ?? 0, 0)
      const orbitDelta = limitAngleDelta(orbit.tangentHeading - state.heading)
      desiredDelta += clamp(orbitDelta, -centeringRate * dt, centeringRate * dt)
    }

    const maxDelta = Math.max(config.maxTurnRate, minTurnRate) * dt
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

    if (orbit && orbit.blend > 0) {
      desiredVel.x = desiredVel.x * (1 - orbit.blend) + orbit.velocity.x * orbit.blend
      desiredVel.y = desiredVel.y * (1 - orbit.blend) + orbit.velocity.y * orbit.blend
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
