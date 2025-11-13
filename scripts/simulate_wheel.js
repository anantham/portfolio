const fs = require('fs')
const path = require('path')

function createRandomSource(seed) {
  let value = seed ?? Math.floor(Math.random() * 0xffffffff)
  const next = () => {
    value = (1664525 * value + 1013904223) >>> 0
    return value / 0x100000000
  }
  const gaussian = () => {
    let u = 0
    let v = 0
    while (u === 0) u = next()
    while (v === 0) v = next()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }
  return { next, gaussian }
}

function wallForce(distance, pad, k) {
  const delta = pad - distance
  if (delta <= 0) return 0
  return k / ((delta * delta) + 1)
}

function createZenRunner(config, seed) {
  const random = createRandomSource(seed)
  const state = {
    time: 0,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    heading: random.next() * Math.PI * 2,
    driftVelocity: 0,
    pausedUntil: 0
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

  const flowField = (x, y, t) => {
    const scale = config.flowScale
    const timeScale = config.flowTimeScale
    const f = n => Math.sin(n) * Math.cos(n * 0.7)
    const strength = config.flowStrength
    return {
      x: strength * f(x * scale + t * timeScale * 0.1 + 13.37),
      y: strength * f(y * scale - t * timeScale * 0.07 + 42.42)
    }
  }

  const limitAngleDelta = delta => {
    let d = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI
    if (d < -Math.PI) d += Math.PI * 2
    return d
  }

  const reset = env => {
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

  const step = env => {
    const dt = clamp(env.deltaTime, 0.001, 0.033)
    state.time += dt

    const { width, height } = env

    if (state.time > state.pausedUntil && random.next() < config.pauseProbability * dt) {
      const window = config.pauseDuration.max - config.pauseDuration.min
      state.pausedUntil = state.time + config.pauseDuration.min + random.next() * (window > 0 ? window : 0)
    }

    const paused = state.time < state.pausedUntil

    const relaxation = dt / Math.max(config.tau, 0.001)
    state.driftVelocity += -state.driftVelocity * relaxation + config.sigma * Math.sqrt(dt) * random.gaussian()
    const targetHeading = state.heading + state.driftVelocity * dt

    const desiredDelta = limitAngleDelta(targetHeading - state.heading)
    const maxDelta = config.maxTurnRate * dt
    const clampDelta = Math.max(-maxDelta, Math.min(maxDelta, desiredDelta))
    state.heading += clampDelta

    const breathe = 1 + config.breatheAmp * Math.cos(2 * Math.PI * config.breatheHz * state.time)
    const targetSpeed = config.baseSpeed * breathe
    const dir = { x: Math.cos(state.heading), y: Math.sin(state.heading) }
    let desiredVel = { x: dir.x * targetSpeed, y: dir.y * targetSpeed }

    if (config.pad > 0) {
      const left = wallForce(state.position.x, config.pad, config.wallK)
      const right = -wallForce(width - state.position.x, config.pad, config.wallK)
      const top = wallForce(state.position.y, config.pad, config.wallK)
      const bottom = -wallForce(height - state.position.y, config.pad, config.wallK)
      desiredVel.x += left + right
      desiredVel.y += top + bottom
    }

    const flow = flowField(state.position.x, state.position.y, state.time)
    desiredVel.x += flow.x
    desiredVel.y += flow.y

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

    state.velocity.x = state.velocity.x + (desiredVel.x - state.velocity.x) * config.ema
    state.velocity.y = state.velocity.y + (desiredVel.y - state.velocity.y) * config.ema

    if (paused) {
      state.velocity.x *= 0.88
      state.velocity.y *= 0.88
    }

    state.position.x += state.velocity.x * dt
    state.position.y += state.velocity.y * dt

    const pad = config.pad
    if (state.position.x < pad) {
      state.position.x = pad
      state.velocity.x *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }
    if (state.position.x > width - pad) {
      state.position.x = width - pad
      state.velocity.x *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }
    if (state.position.y < pad) {
      state.position.y = pad
      state.velocity.y *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }
    if (state.position.y > height - pad) {
      state.position.y = height - pad
      state.velocity.y *= -0.8
      state.heading = Math.atan2(state.velocity.y, state.velocity.x)
    }

    return {
      position: { ...state.position },
      velocity: { ...state.velocity }
    }
  }

  return { reset, step }
}

function createFlowRunner(config, seed) {
  const random = createRandomSource(seed)
  const state = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    time: 0
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

  const pseudoNoise = (x, y, t) => Math.sin(x + t * 0.1) * Math.cos(y * 0.7 - t * 0.05)

  const curl = (x, y, t, scale) => {
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

  const reset = env => {
    state.time = 0
    state.position.x = env.width * 0.5
    state.position.y = env.height * 0.5
    const angle = random.next() * Math.PI * 2
    const speed = config.baseSpeed
    state.velocity.x = Math.cos(angle) * speed
    state.velocity.y = Math.sin(angle) * speed
  }

  const step = env => {
    const dt = clamp(env.deltaTime, 0.001, 0.033)
    state.time += dt

    const flow = curl(
      state.position.x,
      state.position.y,
      state.time * config.noiseTimeScale,
      config.noiseScale
    )

    let desiredVel = {
      x: flow.x * config.curlStrength + state.velocity.x,
      y: flow.y * config.curlStrength + state.velocity.y
    }

    const speed = Math.sqrt(desiredVel.x * desiredVel.x + desiredVel.y * desiredVel.y) || 1
    desiredVel.x = (desiredVel.x / speed) * config.baseSpeed
    desiredVel.y = (desiredVel.y / speed) * config.baseSpeed

    if (config.pad > 0) {
      const left = wallForce(state.position.x, config.pad, config.wallK)
      const right = -wallForce(env.width - state.position.x, config.pad, config.wallK)
      const top = wallForce(state.position.y, config.pad, config.wallK)
      const bottom = -wallForce(env.height - state.position.y, config.pad, config.wallK)
      desiredVel.x += left + right
      desiredVel.y += top + bottom
    }

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

    const pad = config.pad
    if (state.position.x < pad) {
      state.position.x = pad
      state.velocity.x *= -0.7
    }
    if (state.position.x > env.width - pad) {
      state.position.x = env.width - pad
      state.velocity.x *= -0.7
    }
    if (state.position.y < pad) {
      state.position.y = pad
      state.velocity.y *= -0.7
    }
    if (state.position.y > env.height - pad) {
      state.position.y = env.height - pad
      state.velocity.y *= -0.7
    }

    return {
      position: { ...state.position },
      velocity: { ...state.velocity }
    }
  }

  return { reset, step }
}

function loadContent() {
  const contentPath = path.join(__dirname, '..', 'src', 'data', 'content.json')
  const raw = fs.readFileSync(contentPath, 'utf8')
  return JSON.parse(raw)
}

function resolveProfile(data, lens) {
  const wheel = data.physics.dharmaWheel
  const lensProfile = wheel.lensProfiles?.[lens] || {}
  const strategyName = lensProfile.strategy || wheel.defaultStrategy
  const strategy = wheel.strategies[strategyName]
  if (!strategy) {
    throw new Error(`Unknown strategy '${strategyName}' for lens '${lens}'`)
  }
  return {
    name: strategyName,
    type: strategy.type,
    parameters: {
      ...(strategy.parameters || {}),
      ...(lensProfile.parameters || {})
    }
  }
}

function createRunner(type, parameters, seed) {
  if (type === 'zen') {
    return createZenRunner(parameters, seed)
  }
  if (type === 'flow-field') {
    return createFlowRunner(parameters, seed)
  }
  throw new Error(`Unsupported strategy type: ${type}`)
}

function simulate({ runner, durationMs, stepMs, seed, width, height, mouse }) {
  const steps = Math.floor(durationMs / stepMs)
  const log = []
  const summary = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minSpeed: Infinity,
    maxSpeed: -Infinity
  }

  runner.reset({ width, height, time: 0, deltaTime: 0, mouse })

  let time = 0
  let previous = 0

  for (let i = 0; i < steps; i++) {
    const delta = i === 0 ? 0 : stepMs
    time += delta
    const env = {
      width,
      height,
      time: time / 1000,
      deltaTime: delta / 1000,
      mouse
    }
    const result = runner.step(env)
    const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2)

    summary.minX = Math.min(summary.minX, result.position.x)
    summary.maxX = Math.max(summary.maxX, result.position.x)
    summary.minY = Math.min(summary.minY, result.position.y)
    summary.maxY = Math.max(summary.maxY, result.position.y)
    summary.minSpeed = Math.min(summary.minSpeed, speed)
    summary.maxSpeed = Math.max(summary.maxSpeed, speed)

    if (i - previous >= 10) {
      log.push({
        t: time,
        x: result.position.x,
        y: result.position.y,
        speed
      })
      previous = i
    }
  }

  return { log, summary }
}

function main() {
  const args = process.argv.slice(2)
  const options = {
    durationMs: 120000,
    stepMs: 16.67,
    seed: 12345,
    lens: 'engineer',
    width: 1280,
    height: 720,
    strategy: undefined
  }

  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    if (!key.startsWith('--')) continue
    const value = args[i + 1]
    if (value === undefined) continue
    switch (key) {
      case '--duration':
        options.durationMs = Number(value)
        i++
        break
      case '--step':
        options.stepMs = Number(value)
        i++
        break
      case '--seed':
        options.seed = Number(value)
        i++
        break
      case '--lens':
        options.lens = value
        i++
        break
      case '--strategy':
        options.strategy = value
        i++
        break
      case '--width':
        options.width = Number(value)
        i++
        break
      case '--height':
        options.height = Number(value)
        i++
        break
      default:
        break
    }
  }

  const data = loadContent()
  const profile = options.strategy
    ? {
        name: options.strategy,
        type: data.physics.dharmaWheel.strategies[options.strategy]?.type,
        parameters: data.physics.dharmaWheel.strategies[options.strategy]?.parameters || {}
      }
    : resolveProfile(data, options.lens)

  if (!profile.type) {
    throw new Error(`Could not determine strategy type for ${options.strategy || options.lens}`)
  }

  const runner = createRunner(profile.type, profile.parameters, options.seed)
  const { log, summary } = simulate({
    runner,
    durationMs: options.durationMs,
    stepMs: options.stepMs,
    seed: options.seed,
    width: options.width,
    height: options.height,
    mouse: null
  })

  const dir = path.join(__dirname, '..', 'logs')
  fs.mkdirSync(dir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `dharma-wheel-${profile.type}-${timestamp}.json`
  const filePath = path.join(dir, filename)

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        metadata: {
          durationMs: options.durationMs,
          stepMs: options.stepMs,
          seed: options.seed,
          width: options.width,
          height: options.height,
          lens: options.lens,
          strategy: profile
        },
        summary,
        log
      },
      null,
      2
    ),
    'utf8'
  )

  console.log('Simulation summary:')
  console.log(summary)
  console.log(`Log written to ${filePath}`)
}

if (require.main === module) {
  main()
}
