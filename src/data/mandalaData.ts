/* ================================================================== */
/* Breathing Mandala — Data Model                                      */
/* Types, constants, and helpers for the Eightfold Path mandala.       */
/* ================================================================== */

// --------------- Types ---------------

export type PillarId = 'panna' | 'sila' | 'samadhi'

export interface PathFactor {
  /** 0-based position on the outer ring */
  index: number
  /** kebab-case identifier, e.g. "right-view" */
  id: string
  /** English name, e.g. "Right View" */
  name: string
  /** Pāli name, e.g. "Sammā Diṭṭhi" */
  pali: string
  /** Which of the three trainings this factor belongs to */
  pillar: PillarId
  /** Placement angle on the mandala circle (degrees) */
  angle: number
  /** Short prose illustration of this factor */
  illustration: string
  /** Path to the resting-state panel image */
  restingImage: string
  /** Path to the illuminated-state panel image */
  illuminatedImage: string
}

export interface FactorConnection {
  /** Index of the source factor */
  from: number
  /** Index of the destination factor */
  to: number
  /** How the source causally feeds the destination */
  causalLabel: string
}

export interface PillarConnection {
  from: PillarId
  to: PillarId
  causalLabel: string
}

export interface PillarToVimutti {
  pillar: PillarId
  label: string
}

export interface PillarConfig {
  /** English name */
  name: string
  /** Pāli name with diacritics */
  pali: string
  /** Tailwind-compatible base colour class or value */
  color: string
  /** RGBA glow used for ambient effects */
  glowColor: string
  /** Translucent tint for overlays */
  tintColor: string
}

// --------------- Constants ---------------

export const PILLARS: Record<PillarId, PillarConfig> = {
  panna: {
    name: 'Wisdom',
    pali: 'Paññā',
    color: 'sky',
    glowColor: 'rgba(56,189,248,0.16)',
    tintColor: 'rgba(56,189,248,0.08)',
  },
  sila: {
    name: 'Ethical Conduct',
    pali: 'Sīla',
    color: 'amber',
    glowColor: 'rgba(245,158,11,0.16)',
    tintColor: 'rgba(245,158,11,0.08)',
  },
  samadhi: {
    name: 'Mental Training',
    pali: 'Samādhi',
    color: 'emerald',
    glowColor: 'rgba(52,211,153,0.16)',
    tintColor: 'rgba(52,211,153,0.08)',
  },
}

/**
 * Helper to build image paths.
 * "Right View" → id "right-view" → panel slug "view"
 * Pattern: /images/dhamma/panels/{slug}-resting.webp
 */
function panelSlug(id: string): string {
  // Strip the "right-" prefix to get the core noun
  return id.replace(/^right-/, '')
}

export const PATH_FACTORS: PathFactor[] = [
  {
    index: 0,
    id: 'right-view',
    name: 'Right View',
    pali: 'Sammā Diṭṭhi',
    pillar: 'panna',
    angle: -90,
    illustration:
      'Seeing the nature of suffering, its origin, its cessation, and the path leading to its cessation.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-view')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-view')}-illuminated.webp`,
  },
  {
    index: 1,
    id: 'right-intention',
    name: 'Right Intention',
    pali: 'Sammā Saṅkappa',
    pillar: 'panna',
    angle: -45,
    illustration:
      'Renunciation, goodwill, and harmlessness — the heart inclines toward freedom.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-intention')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-intention')}-illuminated.webp`,
  },
  {
    index: 2,
    id: 'right-speech',
    name: 'Right Speech',
    pali: 'Sammā Vācā',
    pillar: 'sila',
    angle: 0,
    illustration:
      'Truthful, harmonious, gentle, and meaningful — speech that heals rather than harms.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-speech')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-speech')}-illuminated.webp`,
  },
  {
    index: 3,
    id: 'right-action',
    name: 'Right Action',
    pali: 'Sammā Kammanta',
    pillar: 'sila',
    angle: 45,
    illustration:
      'Abstaining from harm — acting with care for the welfare of all beings.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-action')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-action')}-illuminated.webp`,
  },
  {
    index: 4,
    id: 'right-livelihood',
    name: 'Right Livelihood',
    pali: 'Sammā Ājīva',
    pillar: 'sila',
    angle: 90,
    illustration:
      'Earning a living without causing harm — work aligned with the path.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-livelihood')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-livelihood')}-illuminated.webp`,
  },
  {
    index: 5,
    id: 'right-effort',
    name: 'Right Effort',
    pali: 'Sammā Vāyāma',
    pillar: 'samadhi',
    angle: 135,
    illustration:
      'Generating and sustaining wholesome states; preventing and abandoning unwholesome ones.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-effort')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-effort')}-illuminated.webp`,
  },
  {
    index: 6,
    id: 'right-mindfulness',
    name: 'Right Mindfulness',
    pali: 'Sammā Sati',
    pillar: 'samadhi',
    angle: 180,
    illustration:
      'Contemplation of body, feelings, mind, and phenomena — present-moment awareness.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-mindfulness')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-mindfulness')}-illuminated.webp`,
  },
  {
    index: 7,
    id: 'right-concentration',
    name: 'Right Concentration',
    pali: 'Sammā Samādhi',
    pillar: 'samadhi',
    angle: 225,
    illustration:
      'Unification of mind through the four jhānas — a still, luminous awareness.',
    restingImage: `/images/dhamma/panels/${panelSlug('right-concentration')}-resting.webp`,
    illuminatedImage: `/images/dhamma/panels/${panelSlug('right-concentration')}-illuminated.webp`,
  },
]

/** Outer ring: each factor feeds causally into the next. */
export const FACTOR_CONNECTIONS: FactorConnection[] = [
  { from: 0, to: 1, causalLabel: 'seeing clearly shapes what you reach for' },
  { from: 1, to: 2, causalLabel: 'intention becomes word' },
  { from: 2, to: 3, causalLabel: 'honest speech becomes honest conduct' },
  {
    from: 3,
    to: 4,
    causalLabel: 'right action repeated becomes right livelihood',
  },
  {
    from: 4,
    to: 5,
    causalLabel: 'sustainable livelihood frees energy for practice',
  },
  { from: 5, to: 6, causalLabel: 'effort sustained becomes attention' },
  {
    from: 6,
    to: 7,
    causalLabel: 'attention gathered becomes concentration',
  },
  {
    from: 7,
    to: 0,
    causalLabel: 'a still mind sees what is actually there',
  },
]

/** Inner triangle: the three trainings reinforce each other. */
export const PILLAR_CONNECTIONS: PillarConnection[] = [
  {
    from: 'sila',
    to: 'samadhi',
    causalLabel: 'No remorse creates mental calm',
  },
  {
    from: 'samadhi',
    to: 'panna',
    causalLabel: 'Stable attention allows for deep investigation',
  },
  {
    from: 'panna',
    to: 'sila',
    causalLabel: 'Insight into causality renders the precepts self-evident',
  },
]

/** Spokes from each training to liberation (vimutti). */
export const PILLAR_TO_VIMUTTI: PillarToVimutti[] = [
  { pillar: 'sila', label: 'Abhaya (fearlessness)' },
  { pillar: 'samadhi', label: 'Dampening sensory jitter for S/N' },
  { pillar: 'panna', label: 'Uprooting the latent tendencies' },
]

// --------------- Helpers ---------------

/**
 * Look up a path factor by its 0-based index.
 * @throws {RangeError} if index is out of bounds.
 */
export function getFactorByIndex(index: number): PathFactor {
  if (index < 0 || index >= PATH_FACTORS.length) {
    throw new RangeError(
      `Factor index must be 0–${PATH_FACTORS.length - 1}, got ${index}`
    )
  }
  return PATH_FACTORS[index]
}

/**
 * Return all path factors belonging to the given pillar/training.
 */
export function getFactorsForPillar(pillar: PillarId): PathFactor[] {
  return PATH_FACTORS.filter((f) => f.pillar === pillar)
}

/**
 * Find the causal connection between two factor indices on the outer ring.
 * Returns `undefined` if no direct connection exists.
 */
export function getConnectionBetween(
  from: number,
  to: number
): FactorConnection | undefined {
  return FACTOR_CONNECTIONS.find((c) => c.from === from && c.to === to)
}
