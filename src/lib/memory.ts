/**
 * Session Memory System
 *
 * Tracks visits and interactions in localStorage.
 * Enables progressive disclosure and novelty-based reordering.
 * Privacy-respecting: all data stays local.
 */

const STORAGE_KEY = 'portfolio_memory'
const BEHAVIOR_KEY = 'portfolio_behavior'

export interface MemoryState {
  visitCount: number
  firstVisit: number          // timestamp
  lastVisit: number           // timestamp
  seenNodes: Set<string>      // IDs of projects/sections deeply engaged with
  interactions: {
    [key: string]: number     // ID -> interaction count
  }
  preferences: {
    selectedLens?: string     // Last selected lens
  }
}

export interface BehaviorState {
  scrollSpeed: 'fast' | 'medium' | 'slow'
  hoverDepth: 'shallow' | 'moderate' | 'deep'
  sessionDuration: number     // seconds in current session
  interactionDensity: number  // interactions per minute
}

/**
 * Initialize or load memory state
 */
export function getMemoryState(): MemoryState {
  if (typeof window === 'undefined') {
    return getDefaultMemoryState()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return initializeMemoryState()
    }

    const parsed = JSON.parse(stored)

    // Convert seenNodes array back to Set
    return {
      ...parsed,
      seenNodes: new Set(parsed.seenNodes || [])
    }
  } catch (error) {
    console.warn('Failed to load memory state:', error)
    return getDefaultMemoryState()
  }
}

/**
 * Save memory state to localStorage
 */
export function saveMemoryState(state: MemoryState): void {
  if (typeof window === 'undefined') return

  try {
    const toStore = {
      ...state,
      seenNodes: Array.from(state.seenNodes)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch (error) {
    console.warn('Failed to save memory state:', error)
  }
}

/**
 * Initialize memory state for first-time visitor
 */
function initializeMemoryState(): MemoryState {
  const now = Date.now()
  const state: MemoryState = {
    visitCount: 1,
    firstVisit: now,
    lastVisit: now,
    seenNodes: new Set(),
    interactions: {},
    preferences: {}
  }

  saveMemoryState(state)
  return state
}

/**
 * Default state (used for SSR or errors)
 */
function getDefaultMemoryState(): MemoryState {
  return {
    visitCount: 0,
    firstVisit: Date.now(),
    lastVisit: Date.now(),
    seenNodes: new Set(),
    interactions: {},
    preferences: {}
  }
}

/**
 * Record a new visit
 */
export function recordVisit(): MemoryState {
  const state = getMemoryState()
  state.visitCount += 1
  state.lastVisit = Date.now()
  saveMemoryState(state)
  return state
}

/**
 * Mark a node as seen
 */
export function markNodeSeen(nodeId: string): void {
  const state = getMemoryState()
  state.seenNodes.add(nodeId)
  saveMemoryState(state)
}

/**
 * Record an interaction with a node
 */
export function recordInteraction(nodeId: string): void {
  const state = getMemoryState()
  state.interactions[nodeId] = (state.interactions[nodeId] || 0) + 1
  saveMemoryState(state)
}

/**
 * Check if a node has been seen
 */
export function hasSeenNode(nodeId: string): boolean {
  const state = getMemoryState()
  return state.seenNodes.has(nodeId)
}

/**
 * Get novelty score for a node (0-1, higher = more novel)
 */
export function getNoveltyScore(nodeId: string): number {
  const state = getMemoryState()

  // If never seen, highly novel
  if (!state.seenNodes.has(nodeId)) {
    return 1.0
  }

  // Factor in interaction count
  const interactions = state.interactions[nodeId] || 0

  // Decay novelty with interactions (logarithmic)
  return Math.max(0, 1 - Math.log(interactions + 1) / 5)
}

/**
 * Save user preference
 */
export function savePreference(key: keyof MemoryState['preferences'], value: any): void {
  const state = getMemoryState()
  state.preferences[key] = value
  saveMemoryState(state)
}

/**
 * Get user preference
 */
export function getPreference(key: keyof MemoryState['preferences']): any {
  const state = getMemoryState()
  return state.preferences[key]
}

/**
 * Get familiarity level (returns a qualitative level based on visit count)
 */
export function getFamiliarityLevel(visitCount: number): 'newcomer' | 'returning' | 'familiar' | 'intimate' {
  if (visitCount <= 1) return 'newcomer'
  if (visitCount <= 3) return 'returning'
  if (visitCount <= 10) return 'familiar'
  return 'intimate'
}

/**
 * Behavior tracking (for current session)
 */

let behaviorState: BehaviorState = {
  scrollSpeed: 'medium',
  hoverDepth: 'moderate',
  sessionDuration: 0,
  interactionDensity: 0
}

let sessionStartTime = Date.now()
let scrollEvents: number[] = []
let hoverEvents: { duration: number }[] = []
let interactionCount = 0

/**
 * Track scroll event
 */
export function trackScroll(): void {
  scrollEvents.push(Date.now())

  // Keep only last 10 seconds of events
  const cutoff = Date.now() - 10000
  scrollEvents = scrollEvents.filter(t => t > cutoff)

  // Compute scroll speed
  if (scrollEvents.length > 10) {
    behaviorState.scrollSpeed = 'fast'
  } else if (scrollEvents.length > 3) {
    behaviorState.scrollSpeed = 'medium'
  } else {
    behaviorState.scrollSpeed = 'slow'
  }
}

/**
 * Track hover event
 */
export function trackHover(duration: number): void {
  hoverEvents.push({ duration })

  // Keep only last 20 hover events
  if (hoverEvents.length > 20) {
    hoverEvents.shift()
  }

  // Compute average hover duration
  const avgDuration = hoverEvents.reduce((sum, e) => sum + e.duration, 0) / hoverEvents.length

  if (avgDuration > 2000) {
    behaviorState.hoverDepth = 'deep'
  } else if (avgDuration > 500) {
    behaviorState.hoverDepth = 'moderate'
  } else {
    behaviorState.hoverDepth = 'shallow'
  }
}

/**
 * Track generic interaction
 */
export function trackInteraction(): void {
  interactionCount++

  const sessionDuration = (Date.now() - sessionStartTime) / 1000
  behaviorState.sessionDuration = sessionDuration
  behaviorState.interactionDensity = interactionCount / (sessionDuration / 60)
}

/**
 * Get current behavior state
 */
export function getBehaviorState(): BehaviorState {
  return { ...behaviorState }
}

/**
 * Should show advanced features based on behavior + memory?
 */
export function shouldShowAdvancedFeatures(): boolean {
  const memory = getMemoryState()
  const behavior = getBehaviorState()

  // Show to returning visitors who are exploring deeply
  if (memory.visitCount >= 2 && behavior.hoverDepth === 'deep') {
    return true
  }

  // Show to highly familiar visitors regardless
  if (memory.visitCount >= 5) {
    return true
  }

  // Show to people who are spending time and interacting
  if (behavior.sessionDuration > 120 && behavior.interactionDensity > 2) {
    return true
  }

  return false
}

/**
 * Get UI complexity level (affects what's shown)
 */
export function getUIComplexity(): 'minimal' | 'standard' | 'rich' | 'maximal' {
  const memory = getMemoryState()
  const behavior = getBehaviorState()

  // First-time visitors or fast scrollers get minimal
  if (memory.visitCount <= 1 || behavior.scrollSpeed === 'fast') {
    return 'minimal'
  }

  // Deep explorers get rich UI
  if (behavior.hoverDepth === 'deep' && behavior.interactionDensity > 3) {
    return 'rich'
  }

  // Intimate visitors get maximal
  if (getFamiliarityLevel(memory.visitCount) === 'intimate') {
    return 'maximal'
  }

  return 'standard'
}

/**
 * Reset memory (for testing or user request)
 */
export function resetMemory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(BEHAVIOR_KEY)
}
