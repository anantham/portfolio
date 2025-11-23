/**
 * Tiny Vaithya - Type Definitions
 *
 * Core types for the Vaithya mascot system.
 * See docs/tiny-vaithya-spec.md for full specification.
 */

export type VaithyaState =
  | 'IDLE'
  | 'WALKING'
  | 'POINTING'
  | 'SITTING'
  | 'SLEEPING'
  | 'TRANSITIONING'

export type VaithyaMood =
  | 'playful'
  | 'calm'
  | 'curious'
  | 'focused'
  | 'sleepy'

export type VaithyaCostume =
  | 'none'
  | 'builder_hat'
  | 'monk_robe'
  | 'wizard_cap'
  | 'leaf_crown'

export type VaithyaAnimation =
  | 'idle'
  | 'walk'
  | 'point_right'
  | 'point_up'
  | 'sit'
  | 'sleep'
  | 'blink'

export type VaithyaDirection = 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export interface VaithyaFullState {
  // Core state
  state: VaithyaState
  mood: VaithyaMood
  costume: VaithyaCostume

  // Position & movement
  position: Position
  targetPosition: Position | null
  direction: VaithyaDirection

  // Animation
  currentAnimation: VaithyaAnimation
  frameIndex: number
  lastFrameTime: number

  // Behavior tracking
  lastActionTime: number
  actionCooldowns: Map<string, number>
  targetElementId: string | null

  // Visibility & interaction
  isVisible: boolean
  isReducedMotion: boolean
}

export interface VaithyaBehavior {
  action: VaithyaAction
  targetId?: string
  position?: Position
  mood?: VaithyaMood
  costume?: VaithyaCostume
  priority?: number
  cooldown?: number
}

export type VaithyaAction =
  | 'ENTER_SCENE'
  | 'WALK_TO_ELEMENT'
  | 'POINT_AT_ELEMENT'
  | 'SIT_ON_ELEMENT'
  | 'GO_TO_SLEEP'
  | 'WAKE_UP'
  | 'STAY_IDLE'
  | 'STAY_OUT_OF_WAY'
  | 'HIDE'
  | 'SHOW'

export interface VaithyaEvent {
  type: VaithyaEventType
  payload?: any
  timestamp: number
}

export type VaithyaEventType =
  | 'PAGE_LOAD'
  | 'SECTION_ENTER'
  | 'SECTION_EXIT'
  | 'ELEMENT_HOVER'
  | 'ELEMENT_CLICK'
  | 'USER_IDLE'
  | 'USER_ACTIVE'
  | 'SCROLL_START'
  | 'SCROLL_STOP'
  | 'TIME_OF_DAY_CHANGE'
  | 'REDUCED_MOTION_CHANGE'

export interface AnimationFrame {
  row: number
  col: number
  duration: number // milliseconds
}

export interface AnimationSequence {
  frames: AnimationFrame[]
  loop: boolean
  fps: number
}

export const ANIMATION_SEQUENCES: Record<VaithyaAnimation, AnimationSequence> = {
  idle: {
    frames: [
      { row: 0, col: 0, duration: 500 },
      { row: 0, col: 1, duration: 500 },
      { row: 0, col: 2, duration: 500 },
    ],
    loop: true,
    fps: 2,
  },
  walk: {
    frames: [
      { row: 1, col: 0, duration: 150 },
      { row: 1, col: 1, duration: 150 },
      { row: 1, col: 2, duration: 150 },
      { row: 1, col: 3, duration: 150 },
    ],
    loop: true,
    fps: 8,
  },
  point_right: {
    frames: [
      { row: 2, col: 0, duration: 300 },
      { row: 2, col: 1, duration: 2000 }, // Hold the point
    ],
    loop: false,
    fps: 2,
  },
  point_up: {
    frames: [
      { row: 2, col: 2, duration: 300 },
      { row: 2, col: 3, duration: 2000 },
    ],
    loop: false,
    fps: 2,
  },
  sit: {
    frames: [
      { row: 3, col: 0, duration: 600 },
      { row: 3, col: 1, duration: 600 },
    ],
    loop: true,
    fps: 2,
  },
  sleep: {
    frames: [
      { row: 4, col: 0, duration: 2000 },
      { row: 4, col: 1, duration: 2000 },
    ],
    loop: true,
    fps: 0.5,
  },
  blink: {
    frames: [
      { row: 5, col: 0, duration: 100 },
      { row: 5, col: 1, duration: 100 },
      { row: 5, col: 2, duration: 100 },
    ],
    loop: false,
    fps: 10,
  },
}

export const COOLDOWNS = {
  pointing: 10000,
  walking: 3000,
  sectionHighlight: 30000,
  sleeping: 60000,
  stateTransition: 500,
} as const

export const SPRITE_SIZE = 32 // pixels
export const WALK_SPEED = 60 // pixels per second
