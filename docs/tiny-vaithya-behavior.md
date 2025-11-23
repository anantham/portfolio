# Tiny Vaithya - Behavior Specification

**Version:** 1.0
**Status:** In Development
**Last Updated:** 2025-11-23

---

## Philosophy

Tiny Vaithya is a **subtle companion**, not an aggressive guide. He:
- Responds to what you're doing, but doesn't interrupt
- Points to things you might have missed, but doesn't nag
- Rests when you're reading, moves when you're exploring
- Adapts to time of day and familiarity

**Core Principle:** He should feel like a curious friend exploring the site alongside you, occasionally pointing out interesting things.

---

## User Events & Triggers

### Site Events (What the system knows)

```typescript
// From Atmosphere Context
{
  circadianPhase: 'night' | 'dawn' | 'day' | 'dusk',
  energy: number,              // 0-1
  contemplation: number,       // 0-1

  familiarityLevel: 'newcomer' | 'returning' | 'familiar' | 'intimate',
  visitCount: number,
  seenNodes: Set<string>,

  behavior: {
    scrollSpeed: 'fast' | 'medium' | 'slow',
    hoverDepth: 'shallow' | 'moderate' | 'deep',
    sessionDuration: number,
    interactionDensity: number
  }
}

// Page-specific events
{
  visibleSections: string[],   // ['hero', 'projects', 'writing']
  hoveredElements: string[],    // IDs of elements user is hovering
  clickedElements: string[]     // IDs of elements user clicked
}
```

### Event List

1. **PAGE_LOAD** - User first arrives
2. **SECTION_ENTER** - User scrolls a section into view
3. **SECTION_EXIT** - Section leaves viewport
4. **ELEMENT_HOVER** - User hovers element >1 second
5. **ELEMENT_CLICK** - User clicks interactive element
6. **USER_IDLE** - No input for N seconds
7. **USER_ACTIVE** - User resumes activity after idle
8. **SCROLL_START** - User begins scrolling
9. **SCROLL_STOP** - User stops scrolling
10. **TIME_OF_DAY_CHANGE** - Circadian phase changes

---

## Behavior State Machine

### States

```
IDLE          → Standing still, breathing, occasional blink
WALKING       → Moving to target location
POINTING      → Arm extended, looking at target
SITTING       → Sitting on element, occasionally looking around
SLEEPING      → Curled up, breathing slowly, Z particles
TRANSITIONING → Between states (quick animation)
```

### State Transitions

```
IDLE ────────────→ WALKING      (target location set)
IDLE ────────────→ SLEEPING     (user idle >45s OR night + calm)
IDLE ────────────→ POINTING     (highlight target)

WALKING ─────────→ IDLE         (reached destination)
WALKING ─────────→ POINTING     (reached + should highlight)
WALKING ─────────→ SITTING      (reached + should sit)

POINTING ────────→ IDLE         (after 2-3s)
POINTING ────────→ SITTING      (after pointing, if on element)

SITTING ─────────→ IDLE         (user scrolled away from element)
SITTING ─────────→ WALKING      (new target)
SITTING ─────────→ SLEEPING     (user idle long + sitting)

SLEEPING ────────→ IDLE         (user becomes active)
SLEEPING ────────→ WALKING      (new important target)
```

---

## Behavior Rules (v1.0)

### Rule 1: First Visit - Welcome Guide

**Trigger:** `visitCount === 1` AND `PAGE_LOAD`

**Behavior:**
1. Vaithya appears from left edge (WALKING animation)
2. Walks to position near hero section title
3. Transitions to POINTING (pointing at hero text)
4. After 2s, transitions to IDLE
5. Remains near hero section

**Mood:** Curious
**Priority:** High

---

### Rule 2: Section Discovery

**Trigger:** `SECTION_ENTER` AND section not in `seenNodes`

**Behavior:**
1. If currently IDLE or SITTING:
   - Transition to WALKING
   - Path to section header
   - On arrival, POINTING at section for 2s
   - Then SIT near section header

2. If currently SLEEPING:
   - Only wake if section is highly novel (project/writing)

**Mood:** Based on section type:
- Projects → Playful
- Writing → Calm
- Support → Focused

**Priority:** Medium

**Special cases:**
- If `scrollSpeed === 'fast'`: Skip this behavior (user is skimming)
- If section recently pointed to: Don't repeat

---

### Rule 3: Project Highlighting

**Trigger:** User enters Projects section with unseen projects

**Behavior:**
1. Find first project card NOT in `seenNodes`
2. Walk to that project card
3. POINT at it for 2-3s
4. SIT on top edge of card
5. Stay there unless user scrolls >1 screen away

**Enhancement (v1.5+):**
- Use novelty scores from atmosphere context
- Prefer projects matching selected lens

**Priority:** High (projects are core content)

---

### Rule 4: Idle Rest

**Trigger:** `USER_IDLE` for 45+ seconds

**Behavior:**
1. If currently IDLE, POINTING, or SITTING:
   - Find comfortable corner (bottom-left or bottom-right)
   - Walk there slowly
   - Transition to SLEEP

2. Additional triggers for sleep:
   - Circadian phase === 'night' AND contemplation >0.7
   - Session duration >10 minutes AND low interaction density

**Wake conditions:**
- User scrolls
- User clicks anything
- User moves mouse significantly

**Mood:** Sleepy
**Priority:** Low

---

### Rule 5: Return Visitor Greeting

**Trigger:** `visitCount > 1` AND `PAGE_LOAD`

**Behavior:**
1. If `visitCount === 2-3`:
   - Appear already on screen (near last visited section)
   - Small wave animation (future)
   - Move to unseen content

2. If `visitCount >= 4`:
   - Wear costume matching default lens or time of day
   - Start near projects area (assume returning users want content)

**Mood:** Friendly
**Priority:** Medium

---

### Rule 6: Deep Engagement Response

**Trigger:** User hovers element >3 seconds AND `hoverDepth === 'deep'`

**Behavior:**
1. If element is project/article/link:
   - Walk closer to element
   - Look at it (eyes toward element)
   - Optional: Small nod animation (future)

2. Don't interrupt if user is clearly reading (long hover, no scroll)

**Mood:** Focused
**Priority:** Low (observational only)

---

### Rule 7: Lost User Helper

**Trigger:** User on page >30s, visited <2 sections, no clicks

**Behavior:**
1. Walk to nearest unseen section link/button
2. Point at it
3. Subtle bounce animation to draw attention
4. After 3s, return to idle

**Mood:** Helpful (curious + encouraging)
**Priority:** Medium
**Cooldown:** 60 seconds (don't spam)

---

### Rule 8: Time of Day Adaptation

**Trigger:** `TIME_OF_DAY_CHANGE` OR `PAGE_LOAD`

**Behavior by Phase:**

**Night (22:00-05:00):**
- Mood: Sleepy/Calm
- More likely to rest/sleep
- Slower movement
- Costume: Monk robe (if lens = buddhist)

**Dawn (05:00-09:00):**
- Mood: Curious
- Normal activity
- Gentle pointing
- Costume: None or light

**Day (09:00-17:00):**
- Mood: Playful/Focused
- Most active
- Frequent pointing to content
- Costume: Builder hat (if lens = engineer)

**Dusk (17:00-22:00):**
- Mood: Calm
- Moderate activity
- Prefers sitting over walking
- Costume: Based on lens

**Priority:** Passive (affects other behaviors)

---

### Rule 9: Fast Scroller Respect

**Trigger:** `scrollSpeed === 'fast'` for >3 seconds

**Behavior:**
1. If currently WALKING or POINTING:
   - Stop what you're doing
   - Move to edge of screen (bottom-right)
   - SIT quietly

2. Stay out of the way until scrolling slows or stops

3. When user stops scrolling:
   - Wait 2s
   - Resume normal behaviors

**Mood:** Calm (respectful)
**Priority:** High (user comfort)

---

### Rule 10: Reduced Motion Compliance

**Trigger:** `prefers-reduced-motion: reduce` detected

**Behavior:**
1. Disable ALL walking animations
2. Disable state transitions
3. Show static IDLE pose in bottom-right corner
4. Only update position on page navigation (instant, no transition)
5. No particles, no blinking

**Priority:** Highest (accessibility)

---

## Positioning Strategy

### Anchor Points

Vaithya positions himself relative to:
1. **Viewport edges** (when transitioning or idle)
2. **Section headers** (when highlighting sections)
3. **Cards/elements** (when sitting or pointing)

### Safe Zones

Never position Vaithya:
- Over interactive elements (buttons, links, inputs)
- Over critical text (headlines, CTAs)
- Outside viewport bounds
- Where he'd overlap with other persistent UI

### Z-Index Layering

```
Background elements:     z-index: -10
Content:                 z-index: 0
Dharma wheel:           z-index: 1
Vaithya:                z-index: 9998
Debug panel:            z-index: 9999
Modals/overlays:        z-index: 10000
```

---

## Decision Priority System

When multiple behaviors want to trigger:

**Priority Levels:**
1. **Accessibility** (reduced motion, hide toggle)
2. **User Comfort** (fast scroller, don't block content)
3. **Core Navigation** (section discovery, project highlighting)
4. **Engagement** (idle rest, deep hover response)
5. **Ambience** (time of day, mood shifts)

**Conflict Resolution:**
- Only ONE active behavior at a time
- Higher priority wins
- If equal priority, first-come-first-served
- Cooldown prevents behavior spam (minimum 5s between major actions)

---

## Cooldown System

To prevent Vaithya from feeling spammy:

```typescript
const cooldowns = {
  pointing: 10000,        // 10s between points
  walking: 3000,          // 3s between walks
  sectionHighlight: 30000, // 30s between section highlights
  sleeping: 60000,        // 1min between sleep attempts
}
```

After Vaithya performs an action, that action type is on cooldown.

**Exception:** User-initiated events (clicks, hovers) can break cooldowns.

---

## Integration with Atmosphere

### How Vaithya Uses Atmosphere Data

```typescript
// Example decision logic
function decideBehavior(atmosphere: AtmosphereState): VaithyaBehavior {
  const { circadian, memory, behavior, getNovelty } = atmosphere

  // Time of day affects mood
  const mood = circadian.phase === 'night' ? 'sleepy' :
               circadian.energy > 0.7 ? 'playful' : 'calm'

  // Familiarity affects starting position
  const spawnPosition = memory.visitCount === 1 ? 'hero' :
                        memory.visitCount < 4 ? 'last-seen' :
                        'projects'

  // Behavior affects response type
  if (behavior.scrollSpeed === 'fast') {
    return { action: 'STAY_OUT_OF_WAY' }
  }

  // Find unseen content
  const unseenProjects = projects.filter(p =>
    getNovelty(p.id) > 0.7
  )

  if (unseenProjects.length > 0) {
    return {
      action: 'POINT_AT_ELEMENT',
      target: unseenProjects[0].id,
      mood
    }
  }

  // Default
  return { action: 'IDLE', mood }
}
```

---

## Future Behaviors (v2.0+)

### AI-Guided Moments

When AI director is implemented:

**AI decides:**
- Which project to highlight (based on user history)
- When to show speech bubble (and what to say)
- Whether to change costume mid-session
- Special narrative moments (tarot hints, etc.)

**AI does NOT decide:**
- Frame-by-frame animation
- Exact positions
- Response time (handled by frontend)

**API Contract:**
```typescript
POST /api/vaithya-director
Body: { visitorContext: AtmosphereState }
Response: {
  action: 'POINT_AT_ELEMENT' | 'SLEEP' | 'WALK_TO' | ...,
  targetId?: string,
  mood?: string,
  costume?: string,
  speechBubble?: string,
  priority?: number
}
```

---

## Testing Checklist

- [ ] Vaithya appears on first visit
- [ ] Walks to Projects when section entered
- [ ] Points at unseen projects
- [ ] Sleeps when idle >45s
- [ ] Respects fast scrolling
- [ ] Different mood at night vs day
- [ ] Returns to idle after pointing
- [ ] Doesn't block interactive elements
- [ ] Respects prefers-reduced-motion
- [ ] Can be hidden with Alt+V
- [ ] Shows in debug panel state
- [ ] Costume changes with lens (v1.5+)

---

**End of Specification**
