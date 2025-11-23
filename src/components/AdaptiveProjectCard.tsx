/**
 * Adaptive Project Card
 *
 * A project card that progressively reveals details based on:
 * - Visit count (familiarity)
 * - Novelty (whether you've seen it before)
 * - Hover behavior (deep vs shallow engagement)
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAtmosphere, useHoverTracking } from '@/contexts/AtmosphereContext'
import { useState, useEffect } from 'react'
import { ExternalLink, Sparkles } from 'lucide-react'

interface AdaptiveProjectCardProps {
  id: string
  title: string
  subtitle: string
  description: string
  deepDescription?: string // Only shown to returning visitors
  hiddenInsight?: string   // Only shown to intimate visitors
  tags: string[]
  gradient: string
  icon: React.ComponentType<any>
  links?: {
    demo?: string
    github?: string
  }
}

export default function AdaptiveProjectCard({
  id,
  title,
  subtitle,
  description,
  deepDescription,
  hiddenInsight,
  tags,
  gradient,
  icon: Icon,
  links
}: AdaptiveProjectCardProps) {
  const {
    familiarityLevel,
    uiComplexity,
    getNovelty,
    recordNodeInteraction,
    theme
  } = useAtmosphere()

  const hoverTracking = useHoverTracking(id)
  const [novelty, setNovelty] = useState(1)
  const [showHiddenInsight, setShowHiddenInsight] = useState(false)

  useEffect(() => {
    setNovelty(getNovelty(id))
  }, [id, getNovelty])

  const handleClick = () => {
    recordNodeInteraction(id)
    setNovelty(getNovelty(id))
  }

  // Determine what to show based on familiarity
  const showDeepDescription = familiarityLevel !== 'newcomer' && deepDescription
  const canShowHiddenInsight = familiarityLevel === 'intimate' && hiddenInsight

  // Visual emphasis based on novelty
  const noveltyGlow = novelty > 0.7 ? 'shadow-lg shadow-dharma-500/20' : ''

  // Animation speed based on circadian theme
  const animationSpeed = 0.6 / theme.speed

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: animationSpeed }}
      viewport={{ once: true }}
      className="relative"
    >
      <motion.div
        {...hoverTracking}
        onClick={handleClick}
        whileHover={{
          scale: uiComplexity === 'minimal' ? 1 : 1.02,
          y: uiComplexity === 'minimal' ? 0 : -5
        }}
        className={`
          glass-card p-6 rounded-2xl h-full
          bg-gradient-to-br ${gradient}
          border border-zen-700/50 hover:border-zen-600/70
          transition-all duration-300
          cursor-pointer
          ${noveltyGlow}
        `}
      >
        {/* Novelty indicator - subtle dot for unseen content */}
        {novelty > 0.8 && uiComplexity !== 'minimal' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-dharma-400"
            style={{
              boxShadow: '0 0 10px var(--circadian-glow)'
            }}
          />
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-zen-800/50">
            <Icon size={24} style={{ color: theme.accent }} />
          </div>

          {/* Familiarity badge - only show to returning visitors */}
          {familiarityLevel !== 'newcomer' && novelty < 0.3 && (
            <span className="px-2 py-1 rounded-full text-xs text-zen-400 bg-zen-800/30">
              Explored
            </span>
          )}
        </div>

        <h3 className="text-xl font-medium text-zen-50 mb-2">
          {title}
        </h3>

        <p className="text-sm font-medium mb-3" style={{ color: theme.accent }}>
          {subtitle}
        </p>

        <p className="text-sm text-zen-300 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Progressive disclosure: deeper description */}
        <AnimatePresence>
          {showDeepDescription && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <p className="text-sm text-zen-400 leading-relaxed italic border-l-2 border-zen-700 pl-3">
                {deepDescription}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, uiComplexity === 'minimal' ? 2 : 4).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs bg-zen-800/50 text-zen-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        {links && uiComplexity !== 'minimal' && (
          <div className="flex gap-3 mt-auto">
            {links.demo && (
              <a
                href={links.demo}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs hover:text-zen-300 transition-colors"
                style={{ color: theme.accent }}
              >
                <ExternalLink size={12} />
                Demo
              </a>
            )}
            {links.github && (
              <a
                href={links.github}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-zen-400 hover:text-zen-300 transition-colors"
              >
                <ExternalLink size={12} />
                Source
              </a>
            )}
          </div>
        )}

        {/* Hidden insight - only for intimate visitors */}
        {canShowHiddenInsight && (
          <div className="mt-4 pt-4 border-t border-zen-700/30">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                setShowHiddenInsight(!showHiddenInsight)
              }}
              className="flex items-center gap-2 text-xs text-dharma-400 hover:text-dharma-300 transition-colors"
            >
              <Sparkles size={12} />
              <span>{showHiddenInsight ? 'Hide' : 'Show'} hidden insight</span>
            </motion.button>

            <AnimatePresence>
              {showHiddenInsight && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-xs text-dharma-300 leading-relaxed"
                >
                  {hiddenInsight}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
