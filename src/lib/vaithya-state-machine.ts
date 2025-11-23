/**
 * Tiny Vaithya - State Machine
 *
 * Manages state transitions, behavior logic, and animation control.
 * See docs/tiny-vaithya-behavior.md for behavior rules.
 */

import type {
  VaithyaFullState,
  VaithyaState,
  VaithyaBehavior,
  VaithyaEvent,
  Position,
  VaithyaAnimation,
  VaithyaMood,
} from './vaithya-types'
import { COOLDOWNS, SPRITE_SIZE, WALK_SPEED } from './vaithya-types'

export class VaithyaStateMachine {
  private state: VaithyaFullState
  private eventQueue: VaithyaEvent[] = []

  constructor(initialPosition: Position = { x: 50, y: window.innerHeight - 100 }) {
    this.state = {
      state: 'IDLE',
      mood: 'curious',
      costume: 'none',
      position: initialPosition,
      targetPosition: null,
      direction: 'right',
      pathProgress: 0,
      pathStartPosition: null,
      pathControlPoint: null,
      currentAnimation: 'idle',
      frameIndex: 0,
      lastFrameTime: Date.now(),
      lastActionTime: Date.now(),
      actionCooldowns: new Map(),
      targetElementId: null,
      isVisible: true,
      isReducedMotion: false,
    }
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<VaithyaFullState> {
    return { ...this.state }
  }

  /**
   * Queue an event for processing
   */
  queueEvent(event: VaithyaEvent): void {
    this.eventQueue.push(event)
  }

  /**
   * Process all queued events and update state
   */
  update(deltaTime: number): void {
    // Process events
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      this.handleEvent(event)
    }

    // Update based on current state
    this.updateState(deltaTime)

    // Update animation frame
    this.updateAnimation(deltaTime)

    // Clean up expired cooldowns
    this.cleanCooldowns()
  }

  /**
   * Apply a behavior directive
   */
  applyBehavior(behavior: VaithyaBehavior): void {
    // Check if action is on cooldown
    const actionKey = behavior.action
    if (this.isOnCooldown(actionKey)) {
      return
    }

    // Apply the behavior
    switch (behavior.action) {
      case 'ENTER_SCENE':
        this.enterScene(behavior.position)
        break

      case 'WALK_TO_ELEMENT':
        this.walkToElement(behavior.targetId!, behavior.position)
        break

      case 'POINT_AT_ELEMENT':
        this.pointAtElement(behavior.targetId!, behavior.position)
        break

      case 'SIT_ON_ELEMENT':
        this.sitOnElement(behavior.targetId!, behavior.position)
        break

      case 'CLIMB_ON_ELEMENT':
        this.climbOnElement(behavior.targetId!, behavior.position)
        break

      case 'PEEK_AT_ELEMENT':
        this.peekAtElement(behavior.targetId!, behavior.position)
        break

      case 'WANDER':
        this.wander()
        break

      case 'FOLLOW_CURSOR':
        this.followCursor(behavior.position)
        break

      case 'GO_TO_SLEEP':
        this.goToSleep(behavior.position)
        break

      case 'WAKE_UP':
        this.wakeUp()
        break

      case 'STAY_IDLE':
        this.transitionTo('IDLE')
        break

      case 'STAY_OUT_OF_WAY':
        this.stayOutOfWay()
        break

      case 'HIDE':
        this.state.isVisible = false
        break

      case 'SHOW':
        this.state.isVisible = true
        break
    }

    // Apply mood and costume if specified
    if (behavior.mood) {
      this.state.mood = behavior.mood
    }

    if (behavior.costume) {
      this.state.costume = behavior.costume
    }

    // Set cooldown
    if (behavior.cooldown) {
      this.setCooldown(actionKey, behavior.cooldown)
    }
  }

  /**
   * Set reduced motion mode
   */
  setReducedMotion(enabled: boolean): void {
    this.state.isReducedMotion = enabled

    if (enabled) {
      // Stop all animations, show static idle
      this.state.state = 'IDLE'
      this.state.currentAnimation = 'idle'
      this.state.frameIndex = 0
      this.state.targetPosition = null
    }
  }

  /**
   * Toggle visibility
   */
  toggleVisibility(): void {
    this.state.isVisible = !this.state.isVisible
  }

  // --- Private Methods ---

  private handleEvent(event: VaithyaEvent): void {
    switch (event.type) {
      case 'REDUCED_MOTION_CHANGE':
        this.setReducedMotion(event.payload.enabled)
        break

      case 'USER_IDLE':
        if (!this.isOnCooldown('sleeping')) {
          this.applyBehavior({
            action: 'GO_TO_SLEEP',
            cooldown: COOLDOWNS.sleeping,
          })
        }
        break

      case 'USER_ACTIVE':
        if (this.state.state === 'SLEEPING') {
          this.wakeUp()
        }
        break

      case 'SCROLL_START':
        // Store scroll state for fast scroller detection
        break

      case 'SCROLL_STOP':
        // Resume normal behavior
        break

      case 'CELEBRATE':
        // v2.5: Celebrate user interactions
        if (this.state.state === 'IDLE' || this.state.state === 'SITTING') {
          this.playOneShotAnimation('stretch') // Celebratory stretch!
        }
        break

      case 'VIEWPORT_RESIZE':
        // v3.0: React to viewport resize
        if (this.state.state === 'IDLE' || this.state.state === 'SITTING') {
          this.playOneShotAnimation('look_around') // Look around at the new space
        }
        break

      case 'MOUSE_MOVE':
        // v3.0: Handled externally - cursor following logic
        break
    }
  }

  private updateState(deltaTime: number): void {
    if (this.state.isReducedMotion) {
      return // No state updates in reduced motion
    }

    switch (this.state.state) {
      case 'WALKING':
        this.updateWalking(deltaTime)
        break

      case 'POINTING':
        this.updatePointing()
        break

      case 'SITTING':
        this.updateSitting()
        break

      case 'SLEEPING':
        this.updateSleeping()
        break

      case 'CLIMBING':
        this.updateClimbing()
        break

      case 'PEEKING':
        this.updatePeeking()
        break

      case 'IDLE':
        this.updateIdle()
        break
    }
  }

  private updateWalking(deltaTime: number): void {
    if (!this.state.targetPosition) {
      this.transitionTo('IDLE')
      return
    }

    // v3.0: Initialize bezier path on first frame
    if (!this.state.pathStartPosition) {
      this.state.pathStartPosition = { ...this.state.position }
      this.state.pathProgress = 0

      // Generate smooth bezier control point
      const dx = this.state.targetPosition.x - this.state.position.x
      const dy = this.state.targetPosition.y - this.state.position.y

      // Control point creates a gentle curve (offset perpendicular to path)
      const midX = this.state.position.x + dx * 0.5
      const midY = this.state.position.y + dy * 0.5
      const offsetX = -dy * 0.2 * (Math.random() - 0.5) // Perpendicular offset
      const offsetY = dx * 0.2 * (Math.random() - 0.5)

      this.state.pathControlPoint = {
        x: midX + offsetX,
        y: midY + offsetY,
      }
    }

    // Calculate total path length for consistent speed
    const start = this.state.pathStartPosition!
    const control = this.state.pathControlPoint!
    const target = this.state.targetPosition

    // Estimate path length (rough approximation)
    const straightDist = Math.sqrt(
      Math.pow(target.x - start.x, 2) + Math.pow(target.y - start.y, 2)
    )

    // Advance progress based on speed
    const progressDelta = (WALK_SPEED * deltaTime) / (1000 * straightDist)
    this.state.pathProgress = Math.min(1, this.state.pathProgress + progressDelta)

    // Quadratic bezier curve: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    const t = this.state.pathProgress
    const oneMinusT = 1 - t

    const newX = oneMinusT * oneMinusT * start.x +
                 2 * oneMinusT * t * control.x +
                 t * t * target.x

    const newY = oneMinusT * oneMinusT * start.y +
                 2 * oneMinusT * t * control.y +
                 t * t * target.y

    // v2.5: Enforce spatial boundaries
    this.state.position = {
      x: Math.max(0, Math.min(window.innerWidth - SPRITE_SIZE, newX)),
      y: Math.max(0, Math.min(window.innerHeight - SPRITE_SIZE, newY)),
    }

    // Update direction based on movement
    const dx = newX - (this.state.position.x || 0)
    this.state.direction = dx > 0 ? 'right' : 'left'

    // Reached target?
    if (this.state.pathProgress >= 1) {
      this.state.position = this.state.targetPosition
      this.state.targetPosition = null
      this.state.pathStartPosition = null
      this.state.pathControlPoint = null
      this.state.pathProgress = 0
      this.transitionTo('IDLE')
    }
  }

  private updatePointing(): void {
    // Pointing is time-based, handled by animation completion
  }

  private updateSitting(): void {
    // Check if target element is still visible
    if (this.state.targetElementId) {
      const element = document.getElementById(this.state.targetElementId)
      if (!element || !this.isElementVisible(element)) {
        this.transitionTo('IDLE')
      }
    }
  }

  private updateSleeping(): void {
    // Sleeping continues until woken
  }

  private updateClimbing(): void {
    // Check if target element is still visible
    if (this.state.targetElementId) {
      const element = document.getElementById(this.state.targetElementId)
      if (!element || !this.isElementVisible(element)) {
        this.transitionTo('IDLE')
      }
    }
  }

  private updatePeeking(): void {
    // Peeking is time-based, will auto-transition
  }

  private updateIdle(): void {
    // Random blink every few seconds
    if (Math.random() < 0.01) {
      // 1% chance per frame (~60fps = blink every 1-2s)
      this.playAnimationOnce('blink')
    }
  }

  private updateAnimation(deltaTime: number): void {
    // Animation frame timing is handled by the component
    // This just tracks which animation should be playing
    this.state.lastFrameTime = Date.now()
  }

  // --- Behavior Actions ---

  private enterScene(position?: Position): void {
    if (position) {
      this.state.position = { x: -SPRITE_SIZE, y: position.y }
      this.state.targetPosition = position
    } else {
      this.state.position = { x: -SPRITE_SIZE, y: window.innerHeight - 100 }
      this.state.targetPosition = { x: 50, y: window.innerHeight - 100 }
    }

    this.transitionTo('WALKING')
    this.setCooldown('walking', COOLDOWNS.walking)
  }

  private walkToElement(elementId: string, position?: Position): void {
    this.state.targetElementId = elementId

    if (position) {
      this.state.targetPosition = position
    } else {
      const element = document.getElementById(elementId)
      if (element) {
        const rect = element.getBoundingClientRect()
        this.state.targetPosition = {
          x: rect.left - SPRITE_SIZE - 10,
          y: rect.top + rect.height / 2 - SPRITE_SIZE / 2,
        }
      }
    }

    this.transitionTo('WALKING')
    this.setCooldown('walking', COOLDOWNS.walking)
  }

  private pointAtElement(elementId: string, position?: Position): void {
    this.state.targetElementId = elementId

    // First walk to element, then point
    this.walkToElement(elementId, position)

    // Set up transition to pointing after reaching destination
    const checkArrival = setInterval(() => {
      if (this.state.state === 'IDLE' || this.state.state === 'SITTING') {
        clearInterval(checkArrival)
        this.transitionTo('POINTING')
        this.setCooldown('pointing', COOLDOWNS.pointing)

        // Auto-transition back to idle after pointing
        setTimeout(() => {
          if (this.state.state === 'POINTING') {
            this.transitionTo('IDLE')
          }
        }, 2500)
      }
    }, 100)
  }

  private sitOnElement(elementId: string, position?: Position): void {
    this.state.targetElementId = elementId

    // Walk to element first
    this.walkToElement(elementId, position)

    // Set up transition to sitting after reaching destination
    const checkArrival = setInterval(() => {
      if (this.state.state === 'IDLE') {
        clearInterval(checkArrival)
        this.transitionTo('SITTING')
      }
    }, 100)
  }

  private goToSleep(position?: Position): void {
    const sleepPosition = position || {
      x: window.innerWidth - SPRITE_SIZE - 20,
      y: window.innerHeight - SPRITE_SIZE - 20,
    }

    if (!position) {
      // Walk to corner first
      this.state.targetPosition = sleepPosition
      this.transitionTo('WALKING')

      // Transition to sleep on arrival
      const checkArrival = setInterval(() => {
        if (this.state.state === 'IDLE') {
          clearInterval(checkArrival)
          this.transitionTo('SLEEPING')
        }
      }, 100)
    } else {
      this.transitionTo('SLEEPING')
    }
  }

  private wakeUp(): void {
    if (this.state.state === 'SLEEPING') {
      this.transitionTo('IDLE')
    }
  }

  private stayOutOfWay(): void {
    // Move to bottom-right corner
    this.state.targetPosition = {
      x: window.innerWidth - SPRITE_SIZE - 20,
      y: window.innerHeight - SPRITE_SIZE - 20,
    }
    this.transitionTo('WALKING')

    // Sit when arrived
    const checkArrival = setInterval(() => {
      if (this.state.state === 'IDLE') {
        clearInterval(checkArrival)
        this.transitionTo('SITTING')
      }
    }, 100)
  }

  private climbOnElement(elementId: string, position?: Position): void {
    this.state.targetElementId = elementId

    // Walk to element first
    this.walkToElement(elementId, position)

    // Set up transition to climbing after reaching destination
    const checkArrival = setInterval(() => {
      if (this.state.state === 'IDLE') {
        clearInterval(checkArrival)

        // Position on top of element
        const element = document.getElementById(elementId)
        if (element) {
          const rect = element.getBoundingClientRect()
          this.state.position = {
            x: rect.left + rect.width / 2 - SPRITE_SIZE / 2,
            y: rect.top - SPRITE_SIZE - 5, // Just above element
          }
        }

        this.transitionTo('CLIMBING')

        // Auto-transition to sitting after climbing
        setTimeout(() => {
          if (this.state.state === 'CLIMBING') {
            this.transitionTo('SITTING')
          }
        }, 3000) // Climb for 3 seconds
      }
    }, 100)
  }

  private peekAtElement(elementId: string, position?: Position): void {
    this.state.targetElementId = elementId

    // Position at edge of screen near element
    const element = document.getElementById(elementId)
    if (element) {
      const rect = element.getBoundingClientRect()

      // Peek from left or right edge
      const peekFromLeft = rect.left < window.innerWidth / 2
      this.state.position = {
        x: peekFromLeft ? -SPRITE_SIZE / 2 : window.innerWidth - SPRITE_SIZE / 2,
        y: rect.top + rect.height / 2 - SPRITE_SIZE / 2,
      }
      this.state.direction = peekFromLeft ? 'right' : 'left'
    }

    this.transitionTo('PEEKING')

    // Auto-transition to entering after peeking
    setTimeout(() => {
      if (this.state.state === 'PEEKING' && element) {
        const rect = element.getBoundingClientRect()
        this.state.targetPosition = {
          x: rect.left - SPRITE_SIZE - 10,
          y: rect.top + rect.height / 2 - SPRITE_SIZE / 2,
        }
        this.transitionTo('WALKING')
      }
    }, 2000) // Peek for 2 seconds
  }

  private wander(): void {
    // v3.0: Random wandering when bored
    // Pick a random point on screen to walk to
    const margin = 50
    const randomX = margin + Math.random() * (window.innerWidth - SPRITE_SIZE - 2 * margin)
    const randomY = margin + Math.random() * (window.innerHeight - SPRITE_SIZE - 2 * margin)

    this.state.targetPosition = {
      x: randomX,
      y: randomY,
    }

    this.transitionTo('WALKING')

    // Return to idle after arriving
    const checkArrival = setInterval(() => {
      if (this.state.state === 'IDLE') {
        clearInterval(checkArrival)
      }
    }, 100)
  }

  private followCursor(cursorPosition?: Position): void {
    // v3.0: Follow the mouse cursor
    if (!cursorPosition) return

    // Walk towards cursor (but not directly on it)
    const offsetX = (Math.random() - 0.5) * 100 // Random offset ±50px
    const offsetY = (Math.random() - 0.5) * 100

    this.state.targetPosition = {
      x: Math.max(0, Math.min(window.innerWidth - SPRITE_SIZE, cursorPosition.x + offsetX)),
      y: Math.max(0, Math.min(window.innerHeight - SPRITE_SIZE, cursorPosition.y + offsetY)),
    }

    this.transitionTo('WALKING')
  }

  // --- State Transitions ---

  private transitionTo(newState: VaithyaState): void {
    if (this.state.state === newState) {
      return
    }

    this.state.state = newState
    this.state.lastActionTime = Date.now()

    // Set appropriate animation
    switch (newState) {
      case 'IDLE':
        this.state.currentAnimation = 'idle'
        break
      case 'WALKING':
        this.state.currentAnimation = 'walk'
        break
      case 'POINTING':
        this.state.currentAnimation = this.state.direction === 'right' ? 'point_right' : 'point_right'
        break
      case 'SITTING':
        this.state.currentAnimation = 'sit'
        break
      case 'SLEEPING':
        this.state.currentAnimation = 'sleep'
        break
      case 'CLIMBING':
        this.state.currentAnimation = 'climb'
        break
      case 'PEEKING':
        this.state.currentAnimation = 'peek'
        break
    }

    this.state.frameIndex = 0
  }

  /**
   * Play a one-shot animation and return to previous animation
   * Used for idle variants, reactions, etc.
   */
  playOneShotAnimation(animation: VaithyaAnimation): void {
    if (this.state.isReducedMotion) return

    // Store current animation to restore after
    const prevAnimation = this.state.currentAnimation
    const prevState = this.state.state

    // Only play one-shots during IDLE or SITTING states
    if (prevState !== 'IDLE' && prevState !== 'SITTING') return

    this.state.currentAnimation = animation
    this.state.frameIndex = 0

    // Calculate duration from animation sequence
    const sequence = require('./vaithya-types').ANIMATION_SEQUENCES[animation]
    const duration = sequence.frames.reduce((sum: number, frame: { duration: number }) => sum + frame.duration, 0)

    // Restore after animation completes
    setTimeout(() => {
      if (this.state.currentAnimation === animation) {
        this.state.currentAnimation = prevAnimation
        this.state.frameIndex = 0
      }
    }, duration)
  }

  private playAnimationOnce(animation: VaithyaAnimation): void {
    // Internal version for blinks
    this.playOneShotAnimation(animation)
  }

  // --- Cooldown Management ---

  private setCooldown(key: string, duration: number): void {
    this.state.actionCooldowns.set(key, Date.now() + duration)
  }

  private isOnCooldown(key: string): boolean {
    const cooldownEnd = this.state.actionCooldowns.get(key)
    if (!cooldownEnd) return false
    return Date.now() < cooldownEnd
  }

  private cleanCooldowns(): void {
    const now = Date.now()
    const toDelete: string[] = []

    this.state.actionCooldowns.forEach((expiry, key) => {
      if (now >= expiry) {
        toDelete.push(key)
      }
    })

    toDelete.forEach(key => this.state.actionCooldowns.delete(key))
  }

  // --- Helpers ---

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    )
  }
}
