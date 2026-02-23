'use client'

import { useState, useEffect, forwardRef } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { ComponentType } from 'react'
import { Wind, Flame, Sprout, ChevronDown } from 'lucide-react'
import orientationData from '@/data/orientationCards.json'
import bioLinksData from '@/data/bioLinks.json'
import content from '@/data/content.json'
import { useOrientation, type OrientationCategory } from '@/contexts/OrientationContext'

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

function CyclingImage({ images, title, priority }: { images: string[]; title: string; priority?: boolean }) {
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
    <div className="relative w-full aspect-[4/3] overflow-hidden bg-zen-950/40">
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
            className="object-contain"
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            priority={priority}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const OrientationCard = forwardRef<HTMLDivElement, {
  card: OrientationCardData
  category: Category
  priority?: boolean
}>(function OrientationCard({
  card,
  category,
  priority
}, ref) {
  const [expanded, setExpanded] = useState(false)
  const config = categoryConfig[category]
  const Icon = config.Icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-zen-700/50 overflow-hidden bg-zen-950/60 backdrop-blur"
    >
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full text-left group"
      >
      <div className={`relative bg-gradient-to-br ${config.gradient}`}>
        <CyclingImage images={card.images} title={card.title} priority={priority} />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-zen-950/70 backdrop-blur text-xs font-medium ${config.accent} ring-1 ring-zen-800/60`}>
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
          {expanded && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-zen-300 leading-relaxed mb-3">
                {renderSummary(card.summary)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
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
  const categories = orientationData.categories as Category[]
  const cards = orientationData.cards as Record<Category, OrientationCardData[]>

  const displayCards: Array<{ card: OrientationCardData; category: Category }> = activeCategory
    ? cards[activeCategory].map(card => ({ card, category: activeCategory }))
    : categories.map(cat => ({ card: cards[cat][0], category: cat }))

  return (
    <section id="lenses-section" className="py-20 px-4">
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
            {displayCards.map(({ card, category }, index) => (
              <OrientationCard
                key={card.id}
                card={card}
                category={category}
                priority={index === 0}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
