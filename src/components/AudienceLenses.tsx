'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Brain, Code, Heart, Flower } from 'lucide-react'
import { content, type LensId } from '@/lib/content'
import { useLens } from '@/contexts/LensContext'
import { bioCards, defaultBioOrder, getRandomBioCard, getRandomBioCardImage, bioLinks, type BioCard } from '@/lib/bio'

interface LensMeta {
  id: LensId
  title: string
  subtitle: string
  icon: React.ComponentType<{ size?: number | string }>
  accent: string
  gradient: string
}

const iconMap: Record<LensId, React.ComponentType<{ size?: number | string }>> = {
  'lw-math': Brain,
  'engineer': Code,
  'embodied': Heart,
  'buddhist': Flower
}

const gradientMap: Record<LensId, { accent: string; gradient: string }> = {
  'lw-math': {
    accent: 'text-blue-300',
    gradient: 'from-blue-500/25 to-cyan-500/15'
  },
  'engineer': {
    accent: 'text-emerald-300',
    gradient: 'from-emerald-500/25 to-green-500/15'
  },
  'embodied': {
    accent: 'text-rose-300',
    gradient: 'from-rose-500/25 to-pink-500/15'
  },
  'buddhist': {
    accent: 'text-dharma-300',
    gradient: 'from-dharma-500/25 to-amber-500/15'
  }
}

interface DisplayCard {
  lens: LensId
  card: BioCard
  image: string
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function selectRandomBioCardsWithUniqueImages(lenses: LensId[]): DisplayCard[] {
  const lensesWithOptions = lenses.map(lens => {
    const cards = shuffle(bioCards[lens])
    const candidates = shuffle(
      cards.flatMap(card => shuffle(card.images).map(image => ({ card, image })))
    )
    return {
      lens,
      candidates,
      uniqueImageCount: new Set(candidates.map(candidate => candidate.image)).size
    }
  })

  const orderedForSearch = [...lensesWithOptions].sort((a, b) => a.uniqueImageCount - b.uniqueImageCount)
  const selectedCards = new Map<LensId, { card: BioCard; image: string }>()
  const usedImages = new Set<string>()

  const backtrack = (index: number): boolean => {
    if (index >= orderedForSearch.length) return true

    const { lens, candidates } = orderedForSearch[index]
    for (const candidate of candidates) {
      if (usedImages.has(candidate.image)) continue
      selectedCards.set(lens, candidate)
      usedImages.add(candidate.image)

      if (backtrack(index + 1)) return true

      usedImages.delete(candidate.image)
      selectedCards.delete(lens)
    }

    return false
  }

  if (!backtrack(0)) {
    return lenses.map(lens => {
      const card = getRandomBioCard(lens)
      return { lens, card, image: getRandomBioCardImage(card) }
    })
  }

  return lenses.map(lens => {
    const selected = selectedCards.get(lens)!
    return { lens, card: selected.card, image: selected.image }
  })
}

const escapeRegExp = (value: string) => {
  const specials = new Set(['\\', '^', '$', '*', '+', '?', '.', '(', ')', '|', '{', '}', '[', ']'])
  let escaped = ''
  for (const char of value) {
    escaped += specials.has(char) ? `\\${char}` : char
  }
  return escaped
}

const linkedPhrases = bioLinks.map(link => ({
  phrase: link.phrase.trim(),
  href: link.href
}))

const renderSummary = (text: string): ReactNode => {
  let nodes: ReactNode[] = [text]
  let keyIndex = 0

  linkedPhrases.forEach(link => {
    const phrase = link.phrase
    if (!phrase) return
    const regex = new RegExp(escapeRegExp(phrase), 'g')

    nodes = nodes.flatMap(node => {
      if (typeof node !== 'string') return [node]
      if (!regex.test(node)) {
        regex.lastIndex = 0
        return [node]
      }

      regex.lastIndex = 0
      const parts = node.split(regex)
      const segments: ReactNode[] = []
      parts.forEach((part, idx) => {
        if (part) segments.push(part)
        if (idx < parts.length - 1) {
          const linkKey = `bio-link-${phrase}-${keyIndex++}`
          segments.push(
            <a
              key={linkKey}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dharma-300 underline-offset-4 hover:text-dharma-200 hover:underline"
            >
              {phrase}
            </a>
          )
        }
      })
      return segments
    })
  })

  return nodes.map((node, idx) => (typeof node === 'string' ? <span key={`bio-frag-${idx}`}>{node}</span> : node))
}

export default function AudienceLenses() {
  const { selectedLens, setSelectedLens } = useLens()
  const [viewMode, setViewMode] = useState<'mix' | 'uniform'>('mix')
  const [uniformLens, setUniformLens] = useState<LensId | null>(null)
  const initialMixCards = useMemo(() => (
    defaultBioOrder.map(lens => ({
      lens,
      card: bioCards[lens][0],
      image: getRandomBioCardImage(bioCards[lens][0])
    }))
  ), [])

  const [mixCards, setMixCards] = useState<DisplayCard[]>(initialMixCards)

  const lensMap = useMemo<Record<LensId, LensMeta>>(() => {
    return content.lenses.archetypes.reduce((acc, archetype) => {
      acc[archetype.id] = {
        id: archetype.id,
        title: archetype.title,
        subtitle: archetype.subtitle,
        icon: iconMap[archetype.id],
        ...gradientMap[archetype.id]
      }
      return acc
    }, {} as Record<LensId, LensMeta>)
  }, [])

  const regenerateMix = useCallback(() => {
    const lenses = shuffle(defaultBioOrder)
    setMixCards(selectRandomBioCardsWithUniqueImages(lenses))
  }, [])

  useEffect(() => {
    regenerateMix()
  }, [regenerateMix])

  useEffect(() => {
    if (selectedLens && selectedLens !== 'engineer') {
      setViewMode('uniform')
      setUniformLens(selectedLens)
    }
  }, [selectedLens])

  const activeLens: LensId = useMemo(() => {
    if (viewMode === 'uniform') {
      return uniformLens ?? selectedLens ?? 'engineer'
    }
    return selectedLens ?? 'engineer'
  }, [selectedLens, uniformLens, viewMode])

  const uniformCards = useMemo<DisplayCard[]>(() => {
    if (viewMode !== 'uniform') return []
    return bioCards[activeLens].map(card => ({
      lens: activeLens,
      card,
      image: getRandomBioCardImage(card)
    }))
  }, [activeLens, viewMode])

  const handleCardClick = (lens: LensId) => {
    if (viewMode === 'mix') {
      setViewMode('uniform')
      setUniformLens(lens)
      setSelectedLens(lens)
    } else {
      if (uniformLens === lens) {
        setViewMode('mix')
        setUniformLens(null)
        setSelectedLens('engineer')
        regenerateMix()
      } else {
        setUniformLens(lens)
        setSelectedLens(lens)
      }
    }
  }

  const cardsToDisplay: DisplayCard[] = viewMode === 'uniform'
    ? uniformCards
    : mixCards

  return (
    <section id="lenses-section" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50 mb-6">
            {content.lenses.title}
          </h2>
          {content.lenses.subtitle ? (
            <p className="text-lg text-zen-300 max-w-3xl mx-auto">
              {content.lenses.subtitle}
            </p>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {cardsToDisplay.map(({ lens, card, image }, index) => {
            const meta = lensMap[lens]
            const Icon = meta.icon
            const isActive = viewMode === 'uniform' && activeLens === lens

            return (
              <motion.div
                key={`${lens}-${card.id}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="relative"
              >
                <motion.button
                  type="button"
                  onClick={() => handleCardClick(lens)}
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-zen-800/60 bg-zen-950/60 backdrop-blur focus:outline-none transition-all duration-500 ${isActive ? 'ring-2 ring-dharma-400/50 shadow-[0_0_28px_rgba(255,193,79,0.22)]' : 'hover:border-zen-600/50'}`}
                >
                  <div
                    className={`relative w-full overflow-hidden bg-zen-950/40 aspect-[4/3]`}
                  >
                    <Image
                      src={image}
                      alt={card.title}
                      fill
                      className="object-contain"
                      sizes="(min-width: 1280px) 45vw, (min-width: 768px) 50vw, 100vw"
                    />
                    <div className={`absolute inset-0 pointer-events-none bg-gradient-to-tr ${meta.gradient} opacity-40`} />
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-zen-950/70 backdrop-blur ring-1 ring-zen-800/60 ${meta.accent}`}>
                        <Icon size={18} />
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-6">
                    <h3 className="text-xl font-semibold text-zen-50 mb-3">
                      {card.title}
                    </h3>
                    <p className="text-sm text-zen-200 leading-relaxed">
                      {renderSummary(card.summary)}
                    </p>
                  </div>
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
