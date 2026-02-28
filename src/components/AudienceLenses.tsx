'use client'

import { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { ComponentType } from 'react'
import { Wind, Flame, Sprout, ChevronDown } from 'lucide-react'
import orientationData from '@/data/orientationCards.json'
import bioLinksData from '@/data/bioLinks.json'
import content from '@/data/content.json'
import { useOrientation, type OrientationCategory } from '@/contexts/OrientationContext'
import {
  ORIENTATION_CARD_ENTER_DELAY_MS,
  ORIENTATION_CARD_LEAVE_DELAY_MS
} from '@/lib/cardPreviewTiming'
import { usePreloadImages } from '@/hooks/usePreloadImages'

type Category = OrientationCategory

interface OrientationCardData {
  id: string
  title: string
  summary: string
  images: string[]
}

const categoryConfig: Record<Category, {
  label: string
  Icon: ComponentType<{ size?: number | string; className?: string }>
  accent: string
  pillActive: string
  gradient: string
}> = {
  being: {
    label: 'Being',
    Icon: Wind,
    accent: 'text-sky-300',
    pillActive: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
    gradient: 'from-sky-500/20 to-blue-500/10'
  },
  doing: {
    label: 'Doing',
    Icon: Flame,
    accent: 'text-orange-300',
    pillActive: 'bg-orange-500/20 border-orange-400/50 text-orange-200',
    gradient: 'from-orange-500/20 to-amber-500/10'
  },
  becoming: {
    label: 'Becoming',
    Icon: Sprout,
    accent: 'text-emerald-300',
    pillActive: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
    gradient: 'from-emerald-500/20 to-green-500/10'
  }
}

const linkedPhrases = bioLinksData.map(link => ({ phrase: link.phrase.trim(), href: link.href }))
const ORIENTATION_PRELOAD_WIDTHS = [828, 1200]
const ORIENTATION_PRELOAD_QUALITY = 75

function renderSummary(text: string): ReactNode {
  let nodes: ReactNode[] = [text]
  let keyIndex = 0

  linkedPhrases.forEach(link => {
    const phrase = link.phrase
    if (!phrase) return
    const escaped = phrase.replace(/[\\^$*+?.()|{}[\]]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')

    nodes = nodes.flatMap(node => {
      if (typeof node !== 'string') return [node]
      regex.lastIndex = 0
      if (!regex.test(node)) { regex.lastIndex = 0; return [node] }
      regex.lastIndex = 0
      const parts = node.split(regex)
      const segments: ReactNode[] = []
      parts.forEach((part, idx) => {
        if (part) segments.push(part)
        if (idx < parts.length - 1) {
          segments.push(
            <a key={`bl-${phrase}-${keyIndex++}`} href={link.href} target="_blank" rel="noopener noreferrer"
              className="text-dharma-300 underline-offset-4 hover:text-dharma-200 hover:underline">
              {phrase}
            </a>
          )
        }
      })
      return segments
    })
  })

  return nodes.map((node, idx) => typeof node === 'string' ? <span key={`bf-${idx}`}>{node}</span> : node)
}

function CyclingImage({
  images,
  title,
  priority,
  isFeatured
}: {
  images: string[]
  title: string
  priority?: boolean
  isFeatured: boolean
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images.length])

  const src = images[currentIndex] ?? '/images/bio/waterfall.jpg'

  return (
    <motion.div
      className="relative w-full overflow-hidden bg-zen-950/40"
      animate={{ aspectRatio: isFeatured ? 16 / 7 : 4 / 3 }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover"
            sizes={isFeatured ? '(min-width: 1024px) 80vw, 100vw' : '(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw'}
            priority={priority}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

const OrientationCard = forwardRef<HTMLDivElement, {
  card: OrientationCardData
  category: Category
  priority?: boolean
  isFeatured: boolean
  isExpanded: boolean
  onFeatureStart: () => void
  onFeatureEnd: () => void
  onToggleExpand: () => void
}>(function OrientationCard({
  card,
  category,
  priority,
  isFeatured,
  isExpanded,
  onFeatureStart,
  onFeatureEnd,
  onToggleExpand
}, ref) {
  const config = categoryConfig[category]
  const Icon = config.Icon
  const showSummary = isFeatured || isExpanded

  return (
    <motion.div
      ref={ref}
      layout
      onMouseEnter={onFeatureStart}
      onMouseLeave={onFeatureEnd}
      onFocus={onFeatureStart}
      onBlur={onFeatureEnd}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{
        duration: 0.35,
        layout: { type: 'spring', stiffness: 160, damping: 28 }
      }}
      className={`rounded-2xl border border-zen-700/50 overflow-hidden bg-zen-950/60 backdrop-blur ${
        isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
      }`}
    >
      <button
        onClick={onToggleExpand}
        className="w-full text-left group"
      >
      <div className={`relative bg-gradient-to-br ${config.gradient}`}>
        <CyclingImage
          images={card.images}
          title={card.title}
          priority={priority}
          isFeatured={isExpanded}
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur text-xs font-medium ${config.accent} ring-1 ring-white/10`}>
            <Icon size={12} />
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-medium text-zen-50 mb-3 leading-snug">
          {card.title}
        </h3>

        <AnimatePresence initial={false}>
          {showSummary && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, delay: isExpanded ? 0.2 : 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-zen-300 leading-relaxed mb-3">
                {renderSummary(card.summary)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`inline-flex ${config.accent} opacity-40 group-hover:opacity-80 transition-opacity`}
        >
          <ChevronDown size={14} />
        </motion.span>
      </div>
      </button>
    </motion.div>
  )
})

export default function AudienceLenses() {
  const { activeCategory, setActiveCategory } = useOrientation()
  const [featuredCardId, setFeaturedCardId] = useState<string | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const categories = orientationData.categories as Category[]
  const cards = orientationData.cards as Record<Category, OrientationCardData[]>

  const preloadImageSrcs = useMemo(() => {
    const uniqueImages = Array.from(
      new Set(categories.flatMap(category => cards[category].flatMap(card => card.images)))
    )

    return uniqueImages.flatMap((src) =>
      ORIENTATION_PRELOAD_WIDTHS.map(
        (width) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${ORIENTATION_PRELOAD_QUALITY}`
      )
    )
  }, [cards, categories])

  usePreloadImages(preloadImageSrcs)

  const clearFeaturedCard = useCallback(() => {
    if (enterTimerRef.current) { clearTimeout(enterTimerRef.current); enterTimerRef.current = null }
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
    setFeaturedCardId(null)
  }, [])

  const scheduleFeature = useCallback((id: string) => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    enterTimerRef.current = setTimeout(() => setFeaturedCardId(id), ORIENTATION_CARD_ENTER_DELAY_MS)
  }, [])

  const scheduleUnfeature = useCallback(() => {
    if (enterTimerRef.current) { clearTimeout(enterTimerRef.current); enterTimerRef.current = null }
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
    leaveTimerRef.current = setTimeout(() => setFeaturedCardId(null), ORIENTATION_CARD_LEAVE_DELAY_MS)
  }, [])

  useEffect(() => () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
  }, [])

  useEffect(() => {
    clearFeaturedCard()
    setExpandedCardId(null)
  }, [activeCategory, clearFeaturedCard])

  useEffect(() => {
    if (!featuredCardId && !expandedCardId) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!sectionRef.current) return
      const target = event.target as Node | null
      if (!target) return
      if (!sectionRef.current.contains(target)) {
        clearFeaturedCard()
        setExpandedCardId(null)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearFeaturedCard()
        setExpandedCardId(null)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [featuredCardId, expandedCardId, clearFeaturedCard])

  const displayCards: Array<{ card: OrientationCardData; category: Category }> = activeCategory
    ? cards[activeCategory].map(card => ({ card, category: activeCategory }))
    : categories.map(cat => ({ card: cards[cat][0], category: cat }))

  const orderedDisplayCards = useMemo(() => {
    if (!expandedCardId) return displayCards
    const expanded = displayCards.find(({ card }) => card.id === expandedCardId)
    if (!expanded) return displayCards
    return [expanded, ...displayCards.filter(({ card }) => card.id !== expandedCardId)]
  }, [displayCards, expandedCardId])

  return (
    <section ref={sectionRef} id="lenses-section" className="py-20 px-4" onMouseLeave={scheduleUnfeature}>
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50 mb-8">
            {content.lenses.title}
          </h2>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {categories.map(cat => {
              const config = categoryConfig[cat]
              const CatIcon = config.Icon
              const isActive = activeCategory === cat

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? config.pillActive
                      : 'border-zen-700/50 text-zen-400 hover:border-zen-600/70 hover:text-zen-300'
                    }
                  `}
                >
                  <CatIcon size={15} />
                  {config.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <AnimatePresence mode="popLayout">
            {orderedDisplayCards.map(({ card, category }, index) => {
              const isFeatured = featuredCardId === card.id

              return (
                <OrientationCard
                  key={card.id}
                  card={card}
                  category={category}
                  priority={index === 0}
                  isFeatured={isFeatured}
                  isExpanded={expandedCardId === card.id}
                  onFeatureStart={() => scheduleFeature(card.id)}
                  onFeatureEnd={scheduleUnfeature}
                  onToggleExpand={() => setExpandedCardId(prev => prev === card.id ? null : card.id)}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
