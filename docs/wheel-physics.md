# Dharma Wheel Physics & Motion Algorithms

This document explains the physics-based motion strategies that control the wandering dharma wheel, how they vary by archetype lens, and what each parameter does.

## Overview

The wandering dharma wheel uses physics-based algorithms to create organic, natural-feeling motion. Different archetypes use different strategies and parameters to reflect their philosophical character.

## Motion Strategies

### 1. **Zen Strategy** (`zen`)

Used by: Engineer, Embodied, Buddhist archetypes

Based on the **Ornstein-Uhlenbeck process**, a stochastic differential equation that creates smooth, wandering motion with mean reversion.

**Core Algorithm:**
```typescript
// Ornstein-Uhlenbeck process for heading drift
driftVelocity += -driftVelocity * relaxation + sigma * sqrt(dt) * gaussian()
heading += driftVelocity * dt

// Apply constraints
heading += clamp(desiredDelta, -maxTurnRate * dt, maxTurnRate * dt)

// Velocity smoothing with exponential moving average
velocity = velocity + (desiredVel - velocity) * ema
```

**Key Parameters:**

| Parameter | Effect | Engineer | Embodied | Buddhist |
|-----------|--------|----------|----------|----------|
| `baseSpeed` | Movement speed (px/s) | 8.4 | 48 | 40 |
| `tau` | Relaxation time - how long it "remembers" direction | 8 | 30 | 32 |
| `sigma` | Noise strength - randomness of direction changes | 0.8 | 0.24 | 0.18 |
| `maxTurnRate` | Maximum angular velocity (rad/s) | 1.2 | 0.35 | 0.28 |
| `ema` | Velocity smoothing (higher = more responsive) | 0.2 | 0.1 | 0.12 |
| `breatheAmp` | Speed oscillation amplitude | 0.08 | 0.1 | 0.12 |
| `breatheHz` | Speed oscillation frequency (Hz) | 0.08 | 0.06 | 0.05 |
| `pauseProbability` | Chance to pause per second | 0.008 | 0.012 | 0.015 |
| `pauseDuration.min/max` | Pause length range (seconds) | 0.4-0.75 | 0.5-0.9 | 0.6-1.0 |
| `flowStrength` | Flow field influence strength | 10 | 6 | 4 |
| `mouseAvoidanceRadius` | Distance to start avoiding cursor (px) | 90 | 110 | 130 |
| `mouseAvoidanceStrength` | Avoidance force strength | 16 | 18 | 18 |

**Character Interpretation:**
- **Engineer** (tau=8, sigma=0.8): Quick direction changes, active wandering, pragmatic exploration
- **Embodied** (tau=30, sigma=0.24): Slower, more flowing movements, embodied presence
- **Buddhist** (tau=32, sigma=0.18): Slowest, most contemplative, frequent pauses for reflection

---

### 2. **Flow Field Strategy** (`flow-field`)

Used by: LW/Math archetype

Based on **curl noise fields** - creates swirling, structured patterns inspired by fluid dynamics.

**Core Algorithm:**
```typescript
// Sample noise field at current position
noise = perlinNoise(x * scale + time * timeScale, y * scale)

// Calculate curl (∇ × noise) for divergence-free flow
curl = {
  x: d/dy(noise),
  y: -d/dx(noise)
}

// Apply curl force
velocity += curl * curlStrength * dt
```

**Key Parameters:**

| Parameter | Effect | LW/Math |
|-----------|--------|---------|
| `baseSpeed` | Movement speed (px/s) | 72 |
| `curlStrength` | Strength of swirling motion | 28 |
| `noiseScale` | Spatial frequency of flow field | 0.002 |
| `noiseTimeScale` | Temporal evolution speed | 0.5 |
| `smoothing` | Velocity smoothing factor | 0.15 |
| `mouseAvoidanceRadius` | Cursor avoidance distance (px) | 80 |
| `mouseAvoidanceStrength` | Avoidance force | 18 |

**Character Interpretation:**
- **LW/Math**: Fast, systematic exploration following structured patterns. Reflects rational, model-based thinking with emergent complexity.

---

## Common Features (All Strategies)

### Mouse Interaction
All strategies implement two-phase cursor avoidance:

1. **Soft Avoidance Zone** (`mouseAvoidanceRadius`): Gentle repulsion force
2. **Hard Collision** (`mouseCollisionRadius`): Elastic bounce with damping

```typescript
if (distance < avoidanceRadius) {
  force = strength * (1 - distance / radius) * direction
}

if (distance < collisionRadius) {
  // Elastic reflection with energy loss
  velocity = reflect(velocity, normal) * damping
}
```

### Wall Constraints
Soft wall repulsion prevents wheel from leaving viewport:

```typescript
wallForce(distance, pad, k) = k / ((pad - distance)^2 + 1)
```

Fallback hard boundaries with reflection ensure it never escapes.

### Flow Field Guidance (Zen only)
Adds subtle directional bias using sinusoidal flow:

```typescript
flow = {
  x: sin(x * scale + t * timeScale) * cos(x * 0.7),
  y: sin(y * scale - t * timeScale) * cos(y * 0.7)
} * strength
```

---

## Tuning Guide

### Make it wander MORE:
- Decrease `tau` (faster forgetting)
- Increase `sigma` (more noise)
- Increase `maxTurnRate` (sharper turns)
- Increase `ema` (more responsive)

### Make it CALMER:
- Increase `tau` (longer memory)
- Decrease `sigma` (less noise)
- Decrease `maxTurnRate` (gentler turns)
- Decrease `ema` (more momentum)

### Make it faster/slower:
- Adjust `baseSpeed`
- Adjust `flowStrength` (subtle bias)

### More contemplative:
- Increase `pauseProbability`
- Increase `pauseDuration`
- Decrease `breatheHz` (slower breathing)

---

## Configuration Location

All parameters live in `src/data/content.json` under:
```json
{
  "physics": {
    "dharmaWheel": {
      "visual": {
        "size": 64,
        "opacity": 0.4
      },
      "strategies": {
        "engineer-zen": { ... },
        "lw-flow": { ... },
        "embodied-zen": { ... },
        "buddhist-zen": { ... }
      },
      "lensProfiles": {
        "engineer": { "strategy": "engineer-zen" },
        "lw-math": { "strategy": "lw-flow" },
        "embodied": { "strategy": "embodied-zen" },
        "buddhist": { "strategy": "buddhist-zen" }
      }
    }
  }
}
```

---

## Testing & Simulation

Use the CLI simulator to test parameters:

```bash
node scripts/simulate_wheel.js --lens engineer --duration 60000 --seed 42
```

Options:
- `--lens` - Which archetype lens to test
- `--strategy` - Override strategy name
- `--duration` - Simulation time in ms
- `--step` - Time step in ms (default 16.67)
- `--seed` - Random seed for reproducibility
- `--width`, `--height` - Viewport size

Output saved to `logs/dharma-wheel-<type>-<timestamp>.json`

---

## Implementation Files

- **Strategy Registry**: `src/physics/registry.ts` - Maps strategy names to factories
- **Zen Strategy**: `src/physics/strategies/zen.ts` - O-U process implementation
- **Flow Field Strategy**: `src/physics/strategies/flowField.ts` - Curl noise implementation
- **Types**: `src/physics/types.ts` - Type definitions
- **Random Source**: `src/physics/random.ts` - Seeded RNG for reproducibility
- **React Hook**: `src/hooks/useMotionStrategy.ts` - React integration
- **Component**: `src/components/WanderingDharmaWheel.tsx` - Rendering & canvas

---

## Mathematical Details

### Ornstein-Uhlenbeck Process

The O-U process is a mean-reverting stochastic process described by:

```
dX(t) = -θ(X(t) - μ)dt + σdW(t)
```

Where:
- `θ = 1/tau` - Mean reversion rate
- `μ = 0` - Long-term mean (we use 0 for symmetric wandering)
- `σ = sigma` - Volatility/noise strength
- `dW(t)` - Wiener process (Brownian motion)

In discrete time (Euler-Maruyama method):
```
X(t+dt) = X(t) - (X(t)/tau)dt + sigma*sqrt(dt)*N(0,1)
```

This creates **smooth, continuous wandering** that doesn't drift infinitely but stays bounded.

### Curl Noise

Curl of 2D noise field creates **divergence-free flow** (incompressible):

```
∇ × f = (∂f/∂y, -∂f/∂x)
```

This ensures the flow has no sources/sinks, creating swirling patterns that look natural and fluid-like.

---

## Future Extensions

Potential new strategies:
- **Levy Flight**: Long straight paths with sudden direction changes (power-law distribution)
- **Brownian Bridge**: Start and end points with random path between
- **Attractor-based**: Orbit around fixed or moving points
- **Flock Simulation**: Multiple wheels with alignment/separation behaviors

To add a new strategy:
1. Create `src/physics/strategies/yourStrategy.ts`
2. Implement `StrategyFactory<YourConfig>` interface
3. Register in `src/physics/registry.ts`
4. Add config to `content.json`
5. Test with simulator
6. Document here
