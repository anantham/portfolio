/**
 * Circadian Time System
 *
 * Treats time-of-day as a continuous, felt dimension.
 * Maps the 24-hour cycle to atmospheric properties without UI chrome.
 */

export type CircadianPhase = 'night' | 'dawn' | 'day' | 'dusk'

export interface CircadianState {
  // Raw time data
  hour: number
  minute: number
  phase: CircadianPhase

  // Normalized values (0-1) for smooth interpolation
  dayProgress: number        // 0 at midnight, 0.5 at noon, 1.0 at next midnight
  phaseProgress: number      // Progress through current phase (0-1)

  // Atmospheric properties (derived from time)
  energy: number             // 0 (deep rest) to 1 (peak energy)
  warmth: number             // 0 (cool blues) to 1 (warm golds)
  luminance: number          // 0 (dark) to 1 (bright)
  contemplation: number      // 0 (active) to 1 (reflective)
}

export interface CircadianTheme {
  // Color palette
  background: {
    start: string
    end: string
  }
  accent: string
  glow: string
  text: {
    primary: string
    secondary: string
  }

  // Animation properties
  speed: number              // Multiplier for animation speeds (0.5 - 1.5)
  intensity: number          // Overall intensity of interactions (0.5 - 1.2)

  // Atmospheric
  particleDensity: number    // For any background particles/stars
  blurAmount: number         // Subtle softness
}

/**
 * Get current circadian state based on local time
 */
export function getCurrentCircadianState(): CircadianState {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()

  // Convert to continuous day progress (0-1)
  const dayProgress = (hour + minute / 60) / 24

  // Determine phase and phase progress
  const { phase, phaseProgress } = getPhaseInfo(hour, minute)

  // Compute atmospheric properties
  const energy = computeEnergy(hour, minute)
  const warmth = computeWarmth(hour, minute)
  const luminance = computeLuminance(hour, minute)
  const contemplation = computeContemplation(hour, minute)

  return {
    hour,
    minute,
    phase,
    dayProgress,
    phaseProgress,
    energy,
    warmth,
    luminance,
    contemplation
  }
}

/**
 * Phase boundaries (hours)
 * Night: 22:00 - 05:00
 * Dawn: 05:00 - 09:00
 * Day: 09:00 - 17:00
 * Dusk: 17:00 - 22:00
 */
function getPhaseInfo(hour: number, minute: number): { phase: CircadianPhase; phaseProgress: number } {
  const totalMinutes = hour * 60 + minute

  if (totalMinutes >= 22 * 60 || totalMinutes < 5 * 60) {
    // Night: 22:00 - 05:00 (7 hours = 420 minutes)
    const nightStart = 22 * 60
    const nightMinutes = totalMinutes >= nightStart ? totalMinutes - nightStart : totalMinutes + (24 * 60 - nightStart)
    return {
      phase: 'night',
      phaseProgress: nightMinutes / 420
    }
  } else if (totalMinutes >= 5 * 60 && totalMinutes < 9 * 60) {
    // Dawn: 05:00 - 09:00 (4 hours = 240 minutes)
    return {
      phase: 'dawn',
      phaseProgress: (totalMinutes - 5 * 60) / 240
    }
  } else if (totalMinutes >= 9 * 60 && totalMinutes < 17 * 60) {
    // Day: 09:00 - 17:00 (8 hours = 480 minutes)
    return {
      phase: 'day',
      phaseProgress: (totalMinutes - 9 * 60) / 480
    }
  } else {
    // Dusk: 17:00 - 22:00 (5 hours = 300 minutes)
    return {
      phase: 'dusk',
      phaseProgress: (totalMinutes - 17 * 60) / 300
    }
  }
}

/**
 * Energy level throughout the day
 * Low at night, peaks mid-day, drops in evening
 */
function computeEnergy(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute

  // Peak energy around 14:00 (2 PM)
  const peakTime = 14 * 60

  // Use a smooth curve (cosine-based)
  const angle = ((totalMinutes - peakTime) / (24 * 60)) * Math.PI * 2

  // Cosine gives us -1 to 1, normalize to 0.2-1.0
  return 0.6 + Math.cos(angle) * 0.4
}

/**
 * Warmth: cool at night, warm at sunrise/sunset, neutral midday
 */
function computeWarmth(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute

  // Warm peaks at dawn (~6:30) and dusk (~19:00)
  const dawnPeak = 6.5 * 60
  const duskPeak = 19 * 60

  // Distance to nearest warm time
  const toDawn = Math.abs(totalMinutes - dawnPeak)
  const toDusk = Math.abs(totalMinutes - duskPeak)
  const toNearestWarm = Math.min(toDawn, toDusk)

  // Inverse relationship: closer to dawn/dusk = warmer
  // Max distance in day is 12 hours = 720 minutes
  return 0.3 + (1 - Math.min(toNearestWarm / 360, 1)) * 0.7
}

/**
 * Luminance: dark at night, bright during day
 */
function computeLuminance(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute

  // Peak brightness at noon
  const noonTime = 12 * 60

  // Use a curve that's dark at night, bright at day
  const angle = ((totalMinutes - noonTime) / (24 * 60)) * Math.PI * 2

  // Map to 0.2-1.0 range
  return 0.6 + Math.cos(angle) * 0.4
}

/**
 * Contemplation: higher in early morning and late evening
 * Lower during active day hours
 */
function computeContemplation(hour: number, minute: number): number {
  // Inverse of energy
  return 1 - computeEnergy(hour, minute)
}

/**
 * Generate theme from circadian state
 */
export function getCircadianTheme(state: CircadianState): CircadianTheme {
  switch (state.phase) {
    case 'night':
      return {
        background: {
          start: `hsl(240, ${40 + state.phaseProgress * 10}%, ${5 + state.phaseProgress * 3}%)`,
          end: `hsl(260, ${35 + state.phaseProgress * 5}%, ${8 + state.phaseProgress * 2}%)`
        },
        accent: `hsl(270, 60%, ${40 + state.phaseProgress * 10}%)`,
        glow: `hsl(280, 70%, ${30 + state.phaseProgress * 15}%)`,
        text: {
          primary: `hsl(240, 20%, ${85 + state.phaseProgress * 10}%)`,
          secondary: `hsl(240, 15%, ${60 + state.phaseProgress * 10}%)`
        },
        speed: 0.6 + state.phaseProgress * 0.1,
        intensity: 0.7 + state.phaseProgress * 0.1,
        particleDensity: 1.2,
        blurAmount: 2 + state.phaseProgress * 1
      }

    case 'dawn':
      return {
        background: {
          start: `hsl(${20 + state.phaseProgress * 20}, 45%, ${15 + state.phaseProgress * 15}%)`,
          end: `hsl(${40 + state.phaseProgress * 20}, 50%, ${25 + state.phaseProgress * 20}%)`
        },
        accent: `hsl(${35 + state.phaseProgress * 15}, 70%, ${50 + state.phaseProgress * 10}%)`,
        glow: `hsl(${45 + state.phaseProgress * 20}, 80%, ${60 + state.phaseProgress * 10}%)`,
        text: {
          primary: `hsl(30, 15%, ${80 + state.phaseProgress * 15}%)`,
          secondary: `hsl(30, 10%, ${60 + state.phaseProgress * 15}%)`
        },
        speed: 0.7 + state.phaseProgress * 0.3,
        intensity: 0.8 + state.phaseProgress * 0.3,
        particleDensity: 0.8 - state.phaseProgress * 0.5,
        blurAmount: 2 - state.phaseProgress * 1
      }

    case 'day':
      return {
        background: {
          start: `hsl(210, 25%, ${35 + state.phaseProgress * 5}%)`,
          end: `hsl(220, 30%, ${45 + state.phaseProgress * 5}%)`
        },
        accent: `hsl(25, 70%, 35%)`,
        glow: `hsl(35, 80%, 45%)`,
        text: {
          primary: `hsl(220, 25%, 15%)`,
          secondary: `hsl(220, 20%, 30%)`
        },
        speed: 1.0 + state.phaseProgress * 0.2,
        intensity: 1.1 + state.phaseProgress * 0.1,
        particleDensity: 0.3,
        blurAmount: 0.5
      }

    case 'dusk':
      return {
        background: {
          start: `hsl(${30 - state.phaseProgress * 10}, ${50 - state.phaseProgress * 15}%, ${30 - state.phaseProgress * 15}%)`,
          end: `hsl(${280 + state.phaseProgress * 20}, ${40 - state.phaseProgress * 10}%, ${20 - state.phaseProgress * 12}%)`
        },
        accent: `hsl(${25 - state.phaseProgress * 20}, 75%, ${60 - state.phaseProgress * 20}%)`,
        glow: `hsl(${35 - state.phaseProgress * 30}, 85%, ${70 - state.phaseProgress * 30}%)`,
        text: {
          primary: `hsl(30, ${20 - state.phaseProgress * 5}%, ${90 - state.phaseProgress * 10}%)`,
          secondary: `hsl(30, ${15 - state.phaseProgress * 5}%, ${70 - state.phaseProgress * 15}%)`
        },
        speed: 1.0 - state.phaseProgress * 0.3,
        intensity: 1.0 - state.phaseProgress * 0.2,
        particleDensity: 0.4 + state.phaseProgress * 0.8,
        blurAmount: 0.5 + state.phaseProgress * 2
      }
  }
}

/**
 * Smooth interpolation helper
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
