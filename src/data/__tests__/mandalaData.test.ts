import { describe, it, expect } from 'vitest'
import {
  PATH_FACTORS,
  FACTOR_CONNECTIONS,
  PILLAR_CONNECTIONS,
  PILLAR_TO_VIMUTTI,
  PILLARS,
  getFactorByIndex,
  getFactorsForPillar,
  getConnectionBetween,
  type PillarId,
  type PathFactor,
} from '@/data/mandalaData'

/* ------------------------------------------------------------------ */
/* PATH_FACTORS                                                        */
/* ------------------------------------------------------------------ */
describe('PATH_FACTORS', () => {
  it('contains exactly 8 path factors', () => {
    expect(PATH_FACTORS).toHaveLength(8)
  })

  it('each factor has all required fields', () => {
    const requiredKeys: (keyof PathFactor)[] = [
      'index',
      'id',
      'name',
      'pali',
      'pillar',
      'angle',
      'illustration',
      'restingImage',
      'illuminatedImage',
    ]

    PATH_FACTORS.forEach((factor) => {
      requiredKeys.forEach((key) => {
        expect(factor).toHaveProperty(key)
      })
    })
  })

  it('has sequential indices from 0 to 7', () => {
    PATH_FACTORS.forEach((factor, i) => {
      expect(factor.index).toBe(i)
    })
  })

  it('each factor belongs to a valid pillar', () => {
    const validPillars: PillarId[] = ['panna', 'sila', 'samadhi']
    PATH_FACTORS.forEach((factor) => {
      expect(validPillars).toContain(factor.pillar)
    })
  })

  it('has correct image paths following the naming convention', () => {
    PATH_FACTORS.forEach((factor) => {
      expect(factor.restingImage).toMatch(
        /^\/images\/dhamma\/panels\/[\w-]+-resting\.webp$/
      )
      expect(factor.illuminatedImage).toMatch(
        /^\/images\/dhamma\/panels\/[\w-]+-illuminated\.webp$/
      )
    })
  })
})

/* ------------------------------------------------------------------ */
/* FACTOR_CONNECTIONS — outer ring                                     */
/* ------------------------------------------------------------------ */
describe('FACTOR_CONNECTIONS', () => {
  it('contains exactly 8 connections forming a continuous ring', () => {
    expect(FACTOR_CONNECTIONS).toHaveLength(8)
  })

  it('each connection links factor i to factor (i+1) % 8', () => {
    FACTOR_CONNECTIONS.forEach((conn, i) => {
      expect(conn.from).toBe(i)
      expect(conn.to).toBe((i + 1) % 8)
    })
  })

  it('each connection has a non-empty causalLabel', () => {
    FACTOR_CONNECTIONS.forEach((conn) => {
      expect(conn.causalLabel).toBeTruthy()
      expect(typeof conn.causalLabel).toBe('string')
    })
  })
})

/* ------------------------------------------------------------------ */
/* PILLAR_CONNECTIONS — inner triangle                                 */
/* ------------------------------------------------------------------ */
describe('PILLAR_CONNECTIONS', () => {
  it('contains exactly 3 pillar-to-pillar connections', () => {
    expect(PILLAR_CONNECTIONS).toHaveLength(3)
  })

  it('forms a triangle among the three pillars', () => {
    const edges = PILLAR_CONNECTIONS.map((c) => `${c.from}->${c.to}`)
    expect(edges).toContain('sila->samadhi')
    expect(edges).toContain('samadhi->panna')
    expect(edges).toContain('panna->sila')
  })

  it('each connection has a non-empty causalLabel', () => {
    PILLAR_CONNECTIONS.forEach((conn) => {
      expect(conn.causalLabel).toBeTruthy()
    })
  })
})

/* ------------------------------------------------------------------ */
/* PILLAR_TO_VIMUTTI — spokes to liberation                            */
/* ------------------------------------------------------------------ */
describe('PILLAR_TO_VIMUTTI', () => {
  it('contains exactly 3 spokes to liberation', () => {
    expect(PILLAR_TO_VIMUTTI).toHaveLength(3)
  })

  it('covers all three pillars', () => {
    const pillars = PILLAR_TO_VIMUTTI.map((s) => s.pillar)
    expect(pillars).toContain('panna')
    expect(pillars).toContain('sila')
    expect(pillars).toContain('samadhi')
  })

  it('each spoke has a non-empty label', () => {
    PILLAR_TO_VIMUTTI.forEach((spoke) => {
      expect(spoke.label).toBeTruthy()
    })
  })
})

/* ------------------------------------------------------------------ */
/* PILLARS config                                                      */
/* ------------------------------------------------------------------ */
describe('PILLARS', () => {
  it('has config for all three pillars', () => {
    expect(PILLARS).toHaveProperty('panna')
    expect(PILLARS).toHaveProperty('sila')
    expect(PILLARS).toHaveProperty('samadhi')
  })

  it('each pillar config has name, pali, color, glowColor, tintColor', () => {
    const requiredKeys = ['name', 'pali', 'color', 'glowColor', 'tintColor']
    ;(['panna', 'sila', 'samadhi'] as PillarId[]).forEach((id) => {
      requiredKeys.forEach((key) => {
        expect(PILLARS[id]).toHaveProperty(key)
      })
    })
  })

  it('has correct names and pali for each pillar', () => {
    expect(PILLARS.panna.name).toBe('Wisdom')
    expect(PILLARS.panna.pali).toBe('Paññā')
    expect(PILLARS.sila.name).toBe('Ethical Conduct')
    expect(PILLARS.sila.pali).toBe('Sīla')
    expect(PILLARS.samadhi.name).toBe('Mental Training')
    expect(PILLARS.samadhi.pali).toBe('Samādhi')
  })
})

/* ------------------------------------------------------------------ */
/* Helper: getFactorByIndex                                            */
/* ------------------------------------------------------------------ */
describe('getFactorByIndex', () => {
  it('returns the correct factor for each valid index', () => {
    for (let i = 0; i < 8; i++) {
      const factor = getFactorByIndex(i)
      expect(factor.index).toBe(i)
    }
  })

  it('returns the first factor (Right View) for index 0', () => {
    const factor = getFactorByIndex(0)
    expect(factor.name).toBe('Right View')
    expect(factor.pali).toBe('Sammā Diṭṭhi')
  })

  it('throws for out-of-range index', () => {
    expect(() => getFactorByIndex(-1)).toThrow()
    expect(() => getFactorByIndex(8)).toThrow()
  })
})

/* ------------------------------------------------------------------ */
/* Helper: getFactorsForPillar                                         */
/* ------------------------------------------------------------------ */
describe('getFactorsForPillar', () => {
  it('returns 2 factors for panna (Wisdom)', () => {
    const factors = getFactorsForPillar('panna')
    expect(factors).toHaveLength(2)
    factors.forEach((f) => expect(f.pillar).toBe('panna'))
  })

  it('returns 3 factors for sila (Ethical Conduct)', () => {
    const factors = getFactorsForPillar('sila')
    expect(factors).toHaveLength(3)
    factors.forEach((f) => expect(f.pillar).toBe('sila'))
  })

  it('returns 3 factors for samadhi (Mental Training)', () => {
    const factors = getFactorsForPillar('samadhi')
    expect(factors).toHaveLength(3)
    factors.forEach((f) => expect(f.pillar).toBe('samadhi'))
  })
})

/* ------------------------------------------------------------------ */
/* Helper: getConnectionBetween                                        */
/* ------------------------------------------------------------------ */
describe('getConnectionBetween', () => {
  it('finds the connection between adjacent factors', () => {
    const conn = getConnectionBetween(0, 1)
    expect(conn).toBeDefined()
    expect(conn!.causalLabel).toBe('seeing clearly shapes what you reach for')
  })

  it('finds the wrap-around connection from factor 7 to factor 0', () => {
    const conn = getConnectionBetween(7, 0)
    expect(conn).toBeDefined()
    expect(conn!.causalLabel).toBe('a still mind sees what is actually there')
  })

  it('returns undefined for non-adjacent factors', () => {
    expect(getConnectionBetween(0, 3)).toBeUndefined()
    expect(getConnectionBetween(2, 5)).toBeUndefined()
  })

  it('returns undefined for reverse direction (connections are directional)', () => {
    expect(getConnectionBetween(1, 0)).toBeUndefined()
  })
})
