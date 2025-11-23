# Tiny Vaithya - Character Specification

**Version:** 1.0
**Status:** In Development
**Last Updated:** 2025-11-23

---

## Overview

Tiny Vaithya is a pixel-art mascot character that lives on the portfolio website. He acts as a semi-autonomous guide who responds to user behavior, time of day, and visit history. He's subtle, helpful, and never intrusive.

---

## Visual Design

### Sprite Specifications

- **Base Size:** 32×32 pixels
- **Style:** Chibi pixel art, simplified but expressive
- **Color Palette:** Derived from dharma palette (warm oranges/golds), adapts to circadian theme
- **Pixel Density:** Standard (non-retina), scales cleanly at 2x for HiDPI

### Anatomy

```
Head:  ~10px height
Body:  ~12px height
Legs:  ~8px height
Arms:  ~2px wide, reaching ~6px from body
```

### Facial Features

**Eyes (Primary Expression):**
- Base: 2×2 pixel blocks
- Positions: forward, left, right, up, down
- States:
  - Open (normal)
  - Half-lidded (relaxed/tired)
  - Closed (blink/sleep)
  - Wide (3×3 - surprised)

**Eyebrows (Secondary Expression):**
- 3-4 pixel line above each eye
- Positions:
  - Neutral (straight)
  - Raised (curious/surprised)
  - One raised (mischievous)
  - Angled inward (focused)
  - Arched (kind/friendly)

**Mouth:**
- **v1.0:** NO MOUTH
- All expression via eyes + eyebrows + body language
- Future: Optional 2-3 pixel mouth for "talking" frames only

### Color Scheme

**Base Colors:**
- Primary body: Matches `--circadian-accent` (changes with time)
- Eyes: Dark (high contrast with body)
- Outline: 1px darker than body color

**Circadian Adaptations:**
- Night: Deep blues/purples
- Dawn: Warm oranges/golds
- Day: Bright yellows/oranges
- Dusk: Rich golds/reds

---

## Animation Library (v1.0)

### Core Locomotion

#### 1. IDLE (default)
- **Frames:** 3
- **Duration:** ~2 seconds loop
- **Motion:**
  - Frame 1: Standing neutral
  - Frame 2: Subtle breathing (1px up)
  - Frame 3: Breathing (1px down)
- **Eyes:** Occasionally blink (separate overlay)

#### 2. BLINK
- **Frames:** 3
- **Duration:** 0.3 seconds
- **Motion:**
  - Frame 1: Eyes open
  - Frame 2: Eyes half-closed
  - Frame 3: Eyes closed, return to open
- **Trigger:** Every 3-5 seconds during idle
- **Implementation:** Overlay on other animations

#### 3. WALK
- **Frames:** 4
- **Duration:** 0.6 seconds per cycle
- **Motion:**
  - Classic walk cycle: leg forward, contact, leg back, passing
  - Arms swing opposite to legs
  - Slight head bob (1px)
- **Speed:** 60 pixels/second
- **Variants:**
  - Left (default)
  - Right (horizontally flipped)

#### 4. POINT
- **Frames:** 2
- **Duration:** Hold for 2-3 seconds
- **Motion:**
  - Frame 1: Arm raising
  - Frame 2: Arm fully extended, hold
- **Variants:**
  - Point right (flip for left)
  - Point up (separate animation)
- **Eyes:** Look in pointing direction
- **Eyebrows:** Slightly raised (encouraging)

#### 5. SIT
- **Frames:** 2
- **Duration:** Idle loop while sitting
- **Motion:**
  - Sitting pose, legs forward or dangling
  - Gentle breathing
- **Use:** When positioned on top of cards or sections
- **Variants:**
  - Sit-idle (breathing)
  - Sit-look-around (eyes move)

#### 6. SLEEP
- **Frames:** 2
- **Duration:** Slow breathing, ~4 seconds
- **Motion:**
  - Curled up position (can be horizontal or vertical based on space)
  - Gentle expand/contract breathing
- **Eyes:** Closed
- **Eyebrows:** Relaxed (neutral/slightly arched)
- **Particle:** "Z" floats up every 2 seconds
- **Trigger:** User idle >45 seconds, or night time

---

## Moods (v1.5+)

Moods affect animation speed and eye/eyebrow combinations:

### 1. Playful
- Animations: 20% faster
- Eyebrows: Often raised
- Eyes: Wide, frequent glances

### 2. Calm
- Animations: 20% slower
- Eyebrows: Relaxed
- Eyes: Half-lidded, slow blinks

### 3. Curious
- Animations: Normal speed
- Eyebrows: One raised or both slightly up
- Eyes: Frequently looking around

### 4. Focused
- Animations: Steady, no extra movements
- Eyebrows: Slightly angled inward
- Eyes: Fixed forward or on target

### 5. Sleepy
- Animations: Very slow
- Eyebrows: Relaxed
- Eyes: Half-lidded, slow heavy blinks

---

## Costumes (v1.5+)

Costumes are overlay layers that don't require redrawing base animations.

### Layer System
- **Base:** Character body
- **Costume Layer 1:** Hats/headwear
- **Costume Layer 2:** Body accessories (optional)
- **Props:** Hand-held items (only for specific poses)

### Costume List

#### Hats (4-6 pixels tall, sits on head)

1. **Builder Hat (Engineer Lens)**
   - Yellow hard hat
   - 3-4 pixels tall
   - Small brim

2. **Monk Hood (Buddhist Lens)**
   - Orange/saffron hood
   - Drapes slightly behind head
   - Matches dharma palette

3. **Wizard Cap (LW/Math Lens)**
   - Blue pointed hat
   - Small star detail
   - Slightly tilted

4. **Leaf Crown (Embodied Lens)**
   - Green leaves
   - Organic, asymmetric
   - 2-3 leaves visible

#### When Costumes Appear
- Triggered by selected lens
- Can change with time of day
- Intimate visitors (5+ visits) see rarer costumes

---

## Sprite Sheet Layout

**Recommended organization:**

```
Row 1:  IDLE frames (1-3)
Row 2:  WALK frames (1-4)
Row 3:  POINT frames (1-2) + POINT_UP frames (1-2)
Row 4:  SIT frames (1-2)
Row 5:  SLEEP frames (1-2)
Row 6:  BLINK overlay (1-3)
Row 7:  [Reserved for future animations]
Row 8:  [Reserved for future animations]

Row 9:  COSTUME_HATS (builder, monk, wizard, leaf)
Row 10: COSTUME_ACCESSORIES (if needed)
Row 11: PARTICLES (Z, !, ?, stars)
```

**Total size:** 128×352 pixels (4 columns × 11 rows of 32×32 sprites)

---

## Implementation Notes

### Placeholder Graphics (v0.1)

For initial implementation without pixel art:

- Body: 32×32 rounded rectangle, color = `--circadian-accent`
- Eyes: 2 black circles (4px diameter)
- Eyebrows: 2 black lines (6px wide, 2px tall)
- Animations: CSS transforms and transitions

### Asset Pipeline

1. **Create base sprite in Aseprite/Piskel**
2. **Export as PNG sprite sheet** (no compression)
3. **Save to** `/public/vaithya/sprites.png`
4. **Create metadata JSON** `/public/vaithya/sprites-meta.json`

Example metadata:
```json
{
  "frameWidth": 32,
  "frameHeight": 32,
  "animations": {
    "idle": { "row": 0, "frames": 3, "fps": 2 },
    "walk": { "row": 1, "frames": 4, "fps": 8 },
    "point": { "row": 2, "frames": 2, "fps": 2 }
  }
}
```

---

## Accessibility

- **Respects `prefers-reduced-motion`:** Disables all movement, shows static idle pose
- **Toggle visibility:** Alt+V to hide/show Vaithya
- **Non-intrusive:** Never blocks content
- **Keyboard accessible:** Doesn't interfere with tab navigation
- **Screen readers:** `aria-hidden="true"` on Vaithya element

---

## Performance Targets

- **Frame rate:** 30 FPS minimum (sprite animations)
- **CPU usage:** <2% average
- **Memory:** <5MB total (including sprite assets)
- **Asset size:** <50KB sprite sheet (compressed PNG)

---

## Future Considerations (v2.0+)

- Mouth for "talking" animations
- More complex expressions (sweat drops, stars, hearts)
- Climbing animation (vertical movement)
- Peeking from edges
- Riding the Dharma wheel
- Interaction with cursor (following, avoiding)
- Sound effects (optional, off by default)

---

**End of Specification**
